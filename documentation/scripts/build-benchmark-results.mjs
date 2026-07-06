#!/usr/bin/env node
/**
 * build-benchmark-results.mjs - renders documentation/guide/benchmarks.md
 * from the committed, benchConfig-stamped harness reports in
 * benchmarks/longmemeval/baselines/published/ (W-059).
 *
 * The page is never hand-written: docs CI re-runs this script and
 * fails on any diff, so a number on the page always traces to a
 * committed JSON artifact. Reports produced with a stub provider or
 * stub judge render under an explicit plumbing-only banner - the
 * point of shipping the fixture-backed page before the first real
 * (maintainer-gated, billed) run is to have the skeleton and the
 * gate standing, not to claim quality numbers.
 *
 * Usage:
 *   node documentation/scripts/build-benchmark-results.mjs           # verify (diff mode)
 *   node documentation/scripts/build-benchmark-results.mjs --update  # (re)write the page
 *   node documentation/scripts/build-benchmark-results.mjs --self-test
 *
 * Exit codes: 0 ok · 1 drift in verify mode · 2 invocation error.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUBLISHED_DIR = join(ROOT, 'benchmarks', 'longmemeval', 'baselines', 'published');
const PAGE = join(ROOT, 'documentation', 'guide', 'benchmarks.md');

/** 95% Wilson score interval for a binomial proportion. */
export function wilson(passed, total) {
  if (total === 0) return { low: 0, high: 0 };
  const z = 1.959963984540054;
  const p = passed / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const centre = p + z2 / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total));
  return {
    low: Math.max(0, (centre - margin) / denom),
    high: Math.min(1, (centre + margin) / denom),
  };
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;

/** True when the report ran on stubs and must not read as a result. */
export function isPlumbingOnly(report) {
  const cfg = report.benchConfig ?? {};
  return String(cfg.provider ?? '').includes('stub') || String(cfg.judge ?? '').includes('stub');
}

/** Render one report section. Exported for the self-test. */
export function renderReport(name, report) {
  const cfg = report.benchConfig ?? {};
  const summary = report.summary ?? { total: 0, passed: 0, failed: 0 };
  const aggregates = report.aggregates ?? {};
  const plumbing = isPlumbingOnly(report);
  const ci = wilson(summary.passed ?? 0, summary.total ?? 0);
  const lines = [];
  lines.push(`### \`${name}\``, '');
  if (plumbing) {
    lines.push(
      '> [!CAUTION]',
      '> **Plumbing-only fixture.** This report ran on a stub provider/judge; its numbers verify the harness wiring, NOT memory quality. It will be replaced by the first published real-provider run.',
      '',
    );
  }
  lines.push(
    'Run conditions (from the stamped `benchConfig` of the committed report):',
    '',
    '| Condition | Value |',
    '|---|---|',
    `| Loader | \`${cfg.loader ?? 'unknown'}\` |`,
    `| Mode | \`${cfg.mode ?? 'unknown'}\` |`,
    `| Retrieval | \`${cfg.retrieval ?? 'default'}\` (topK ${cfg.topK ?? '?'}, consolidate ${cfg.consolidate === true}) |`,
    `| Embedder | \`${cfg.embedder ?? 'none'}\` |`,
    `| Provider | \`${cfg.provider ?? 'unknown'}\` |`,
    `| Judge | \`${cfg.judge ?? 'unknown'}\`${cfg.selfJudged === false ? ' (non-self)' : ''} |`,
    `| Iterations | ${cfg.iterations ?? 1} |`,
    '',
    '| Metric | Value |',
    '|---|---|',
    `| Cases | ${summary.total ?? 0} |`,
    `| Pass rate | ${pct((summary.passed ?? 0) / Math.max(1, summary.total ?? 0))} (95% Wilson CI ${pct(ci.low)} to ${pct(ci.high)}) |`,
    ...(aggregates.abstentionRate !== undefined
      ? [`| Abstention rate | ${pct(aggregates.abstentionRate)} |`]
      : []),
    ...(aggregates.tokensPerQuery !== undefined
      ? [`| Tokens/query | ${Math.round(aggregates.tokensPerQuery)} |`]
      : []),
    ...(aggregates.passRateStddev !== undefined && (cfg.iterations ?? 1) > 1
      ? [`| Pass-rate stddev across iterations | ${pct(aggregates.passRateStddev)} |`]
      : []),
    '',
  );
  const byScorer = summary.byScorer ?? {};
  const scorers = Object.keys(byScorer);
  if (scorers.length > 0) {
    lines.push('| Scorer | Pass | Fail | Avg score |', '|---|---:|---:|---:|');
    for (const scorer of scorers.sort()) {
      const s = byScorer[scorer];
      lines.push(
        `| \`${scorer}\` | ${s.passed ?? 0} | ${s.failed ?? 0} | ${(s.avgScore ?? 0).toFixed(3)} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Render the ablation matrix when 2+ reports share a loader and
 * differ only in `benchConfig.retrieval`.
 */
export function renderAblation(entries) {
  const byLoader = new Map();
  for (const { name, report } of entries) {
    const loader = report.benchConfig?.loader ?? 'unknown';
    if (!byLoader.has(loader)) byLoader.set(loader, []);
    byLoader.get(loader).push({ name, report });
  }
  const lines = [];
  for (const [loader, group] of [...byLoader.entries()].sort()) {
    if (group.length < 2) continue;
    lines.push(`### Retrieval ablation (\`${loader}\`)`, '');
    lines.push('| Retrieval | Pass rate | 95% CI | Abstention | Report |', '|---|---|---|---|---|');
    for (const { name, report } of group) {
      const s = report.summary ?? { passed: 0, total: 0 };
      const ci = wilson(s.passed ?? 0, s.total ?? 0);
      const ab = report.aggregates?.abstentionRate;
      lines.push(
        `| \`${report.benchConfig?.retrieval ?? 'default'}\` | ${pct((s.passed ?? 0) / Math.max(1, s.total ?? 0))} | ${pct(ci.low)} to ${pct(ci.high)} | ${ab === undefined ? 'n/a' : pct(ab)} | \`${name}\` |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** Build the whole page from `{ name, report }` entries. */
export function buildPage(entries) {
  const anyReal = entries.some(({ report }) => !isPlumbingOnly(report));
  const head = [
    '---',
    'title: Benchmarks',
    'description: Memory-quality benchmark results rendered from committed, benchConfig-stamped harness reports.',
    '---',
    '',
    '<!-- GENERATED FILE - do not edit by hand. -->',
    '<!-- Source: benchmarks/longmemeval/baselines/published/*.json -->',
    '<!-- Regenerate: node documentation/scripts/build-benchmark-results.mjs --update -->',
    '',
    '# Benchmarks',
    '',
    '> [!WARNING]',
    '> Numbers are workstation numbers: single machine, committed run conditions, no tuning-for-the-test. Every figure on this page is rendered from a committed JSON report and CI fails if the page drifts from those artifacts. Read the conditions table next to each number before comparing anything.',
    '',
    'The [evals guide](/guide/evals) documents the harness itself: non-self judging, Wilson intervals, abstention scoring, and the A/B switches. This page holds the published results.',
    '',
    ...(anyReal
      ? []
      : [
          '> [!IMPORTANT]',
          '> No real-provider run has been published yet. The sections below render the plumbing fixture so the page, the generator, and the CI drift gate are wired end to end; quality numbers land here with the first maintainer-published real run (see `benchmarks/longmemeval/baselines/published/README.md`).',
          '',
        ]),
    '## Comparing with other systems',
    '',
    'Mem0, Zep, and Letta publish LOCOMO / LongMemEval numbers under their own harnesses, judges, and case selections. Cross-system tables without identical conditions mislead more than they inform, so this page links methodologies instead of merging tables: read their published methods next to the `benchConfig` conditions printed here and compare like with like.',
    '',
    '## Published reports',
    '',
  ];
  const sections = entries.map(({ name, report }) => renderReport(name, report));
  const ablation = renderAblation(entries);
  return `${head.join('\n')}${sections.join('\n')}${ablation.length > 0 ? `\n${ablation}` : ''}`;
}

function collectEntries() {
  let files;
  try {
    files = readdirSync(PUBLISHED_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  return files.sort().map((f) => ({
    name: f,
    report: JSON.parse(readFileSync(join(PUBLISHED_DIR, f), 'utf8')),
  }));
}

function run() {
  const entries = collectEntries();
  if (entries.length === 0) {
    console.error('[build-benchmark-results] no published reports found - refusing a blank page.');
    process.exit(2);
  }
  const next = `${buildPage(entries)}\n`;
  const update = process.argv.includes('--update');
  if (update) {
    writeFileSync(PAGE, next, 'utf8');
    console.log(`[build-benchmark-results] wrote ${PAGE} from ${entries.length} report(s).`);
    return;
  }
  let current = null;
  try {
    current = readFileSync(PAGE, 'utf8');
  } catch {
    // fallthrough to drift error
  }
  if (current !== next) {
    console.error(
      '[build-benchmark-results] documentation/guide/benchmarks.md drifted from the committed reports.\n' +
        'Regenerate: node documentation/scripts/build-benchmark-results.mjs --update',
    );
    process.exit(1);
  }
  console.log('[build-benchmark-results] OK - page matches the committed reports.');
}

function selfTest() {
  const mk = (provider, retrieval, passed, total) => ({
    benchConfig: { loader: 'longmemeval', mode: 'memory', retrieval, provider, judge: provider },
    summary: { total, passed, failed: total - passed, byScorer: {} },
    aggregates: { abstentionRate: 0.1 },
  });
  const stub = mk('stub (plumbing-only)', 'default', 2, 3);
  const real = mk('anthropic:claude-x', 'hyde', 80, 100);
  const cases = [];
  const ciReal = wilson(80, 100);
  cases.push(['wilson centre sane', ciReal.low > 0.7 && ciReal.high < 0.88]);
  cases.push(['wilson empty', wilson(0, 0).low === 0 && wilson(0, 0).high === 0]);
  cases.push(['stub detected as plumbing', isPlumbingOnly(stub)]);
  cases.push(['real not plumbing', !isPlumbingOnly(real)]);
  const stubSection = renderReport('stub.json', stub);
  cases.push(['plumbing banner present', stubSection.includes('Plumbing-only fixture')]);
  cases.push([
    'conditions table present',
    stubSection.includes('| Provider | `stub (plumbing-only)` |'),
  ]);
  const realSection = renderReport('real.json', real);
  cases.push(['no banner on real report', !realSection.includes('Plumbing-only fixture')]);
  cases.push([
    'pass rate with CI rendered',
    /Pass rate \| 80\.0% \(95% Wilson CI/.test(realSection),
  ]);
  const page = buildPage([
    { name: 'a.json', report: mk('real', 'default', 70, 100) },
    { name: 'b.json', report: mk('real', 'hyde', 75, 100) },
  ]);
  cases.push(['ablation matrix across retrieval variants', page.includes('Retrieval ablation')]);
  cases.push(['no-real banner absent when real present', !page.includes('No real-provider run')]);
  const stubPage = buildPage([{ name: 's.json', report: stub }]);
  cases.push([
    'no-real banner present on all-stub page',
    stubPage.includes('No real-provider run'),
  ]);
  let bad = 0;
  for (const [label, pass] of cases) {
    if (!pass) {
      bad += 1;
      console.error(`self-test FAIL [${label}]`);
    }
  }
  console.log(
    bad === 0
      ? `[build-benchmark-results] self-test: ${cases.length}/${cases.length} ok`
      : `[build-benchmark-results] self-test: ${bad} failed`,
  );
  process.exit(bad > 0 ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();
else run();
