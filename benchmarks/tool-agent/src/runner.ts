import pkg from '../package.json' with { type: 'json' };
/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * CLI entry point for the tool-agent harness benchmark. Runs the suite,
 * compares `pass^1` / `pass^k` against `data/baseline.json`, writes
 * `RESULTS.md`, and fails (exit 1) on a regression. `--smoke` runs fewer
 * attempts and never gates; `TOOL_AGENT_REGRESSION_STRICT=0` reports
 * without gating. Fully offline - no model, no network.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runToolAgentSuite, type SuiteMetrics } from './harness.js';

export const VERSION: string = pkg.version;

interface BaselineFile {
  readonly suiteId: string;
  readonly k: number;
  readonly passAt1: number;
  readonly passAtK: number;
  readonly taskCount: number;
  readonly frameworkVersion: string;
}

const EPSILON = 1e-9;

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

async function loadBaseline(): Promise<BaselineFile> {
  const raw = await readFile(join(pkgRoot(), 'data', 'baseline.json'), 'utf8');
  return JSON.parse(raw) as BaselineFile;
}

/** Run the suite at the baseline's `k` (or an override). For tests + callers. */
export async function runToolAgentBenchmark(
  options: { readonly k?: number } = {},
): Promise<SuiteMetrics> {
  const baseline = await loadBaseline();
  return runToolAgentSuite({ k: options.k ?? baseline.k });
}

function renderResults(metrics: SuiteMetrics, baseline: BaselineFile): string {
  return [
    '# Tool-agent harness benchmark - results',
    '',
    `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
    '',
    `_Generated: ${new Date().toISOString()}_`,
    '',
    '## Suite',
    '',
    '| Metric | Value | Baseline |',
    '| --- | --- | --- |',
    `| Tasks | ${String(metrics.taskCount)} | ${String(baseline.taskCount)} |`,
    `| Attempts per task (k) | ${String(metrics.k)} | ${String(baseline.k)} |`,
    `| pass^1 | ${metrics.passAt1.toFixed(3)} | ${baseline.passAt1.toFixed(3)} |`,
    `| pass^k | ${metrics.passAtK.toFixed(3)} | ${baseline.passAtK.toFixed(3)} |`,
    '',
    '## Per task',
    '',
    '| Task | pass^1 | pass^k | passes/k |',
    '| --- | --- | --- | --- |',
    ...metrics.tasks.map(
      (t) =>
        `| ${t.taskId} | ${t.passAt1 ? 'yes' : 'no'} | ${t.passAtK ? 'yes' : 'no'} | ${String(t.passes)}/${String(t.attempts)} |`,
    ),
    '',
    '## Scorer averages (suite)',
    '',
    '| Scorer | Avg score |',
    '| --- | --- |',
    ...Object.entries(metrics.scorerAverages).map(
      ([name, avg]) => `| ${name} | ${avg.toFixed(3)} |`,
    ),
    '',
  ].join('\n');
}

export async function main(): Promise<void> {
  const smoke = process.argv.includes('--smoke');
  const baseline = await loadBaseline();
  const k = smoke ? 2 : baseline.k;
  const metrics = await runToolAgentSuite({ k });

  const regressed =
    metrics.passAtK + EPSILON < baseline.passAtK || metrics.passAt1 + EPSILON < baseline.passAt1;

  console.log(
    [
      `[benchmark-tool-agent] Graphorin v${VERSION}`,
      `tasks=${String(metrics.taskCount)} k=${String(metrics.k)} pass^1=${metrics.passAt1.toFixed(3)} pass^k=${metrics.passAtK.toFixed(3)}`,
      `baseline pass^1=${baseline.passAt1.toFixed(3)} pass^k=${baseline.passAtK.toFixed(3)}`,
    ].join(' - '),
  );
  for (const t of metrics.tasks) {
    if (!t.passAtK) {
      console.error(`[benchmark-tool-agent]   ✗ ${t.taskId}: ${t.failReasons.join('; ')}`);
    }
  }

  if (!smoke) {
    await writeFile(join(pkgRoot(), 'RESULTS.md'), renderResults(metrics, baseline), 'utf8');
  }

  const strict = process.env.TOOL_AGENT_REGRESSION_STRICT !== '0' && !smoke;
  if (regressed && strict) {
    console.error(
      `[benchmark-tool-agent] regression: pass^k ${metrics.passAtK.toFixed(3)} < baseline ${baseline.passAtK.toFixed(3)}`,
    );
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
