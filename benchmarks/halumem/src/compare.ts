/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * deep-retest-0.13.11 P2: report-level A/B comparison for two HaluMem
 * runs (canonically `--conflict-pipeline on` vs `off`). The A/B value
 * of the conflict pipeline is visible even when the `on` leg is not
 * fully passing, but reading it required diffing two JSON reports by
 * hand - this renders the per-scorer and per-case comparison as one
 * markdown table.
 *
 * Usage:
 *   node ./dist/compare.js --a on.json --b off.json \
 *     [--label-a "conflict on"] [--label-b "conflict off"] [--results compare.md]
 *
 * The inputs are the `--json` artifacts written by the benchmark
 * runner (they carry `benchConfig` + the full eval report).
 */

import { realpathSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/** Minimal structural slice of a runner `--json` artifact we compare. */
export interface ComparableReport {
  readonly summary: { readonly total: number; readonly passed: number; readonly failed: number };
  readonly results: ReadonlyArray<{
    readonly caseId: string;
    readonly scores: ReadonlyArray<{
      readonly scorer: string;
      readonly result: { readonly pass: boolean; readonly score?: number };
    }>;
  }>;
  readonly benchConfig?: {
    readonly conflictPipeline?: string;
    readonly stage?: string;
    readonly embedder?: string;
    readonly provider?: string;
    readonly observedCostUsd?: number;
  };
}

/** One parsed CLI invocation. */
export interface CompareArgs {
  a: string;
  b: string;
  labelA?: string;
  labelB?: string;
  results?: string;
  help?: boolean;
}

const USAGE = `Usage: compare --a <report.json> --b <report.json> [options]

Options:
  --a <path>          First run's --json artifact (e.g. conflict-pipeline on)
  --b <path>          Second run's --json artifact (e.g. conflict-pipeline off)
  --label-a <text>    Display label for the first run (default from benchConfig)
  --label-b <text>    Display label for the second run
  --results <path>    Also write the markdown comparison to this file
  --help              Show this help`;

/** Parse argv. Throws `Error` with a usable message on bad input. */
export function parseCompareArgs(argv: ReadonlyArray<string>): CompareArgs {
  const args: Partial<CompareArgs> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    const value = (flag: string, v: string | undefined): string => {
      if (v === undefined || v.startsWith('--')) throw new Error(`${flag} requires a value`);
      i += 1;
      return v;
    };
    if (a === '--a') args.a = value(a, next);
    else if (a === '--b') args.b = value(a, next);
    else if (a === '--label-a') args.labelA = value(a, next);
    else if (a === '--label-b') args.labelB = value(a, next);
    else if (a === '--results') args.results = value(a, next);
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`unknown option: ${a}`);
  }
  if (args.help === true) return { a: '', b: '', help: true };
  if (args.a === undefined || args.b === undefined) {
    throw new Error('both --a and --b are required (see --help)');
  }
  return args as CompareArgs;
}

function defaultLabel(report: ComparableReport, fallback: string): string {
  const cfg = report.benchConfig;
  if (cfg?.conflictPipeline !== undefined) return `conflict-pipeline ${cfg.conflictPipeline}`;
  return fallback;
}

function scorerNames(report: ComparableReport): string[] {
  const names = new Set<string>();
  for (const r of report.results) for (const s of r.scores) names.add(s.scorer);
  return [...names];
}

function passCount(report: ComparableReport, scorer: string): { passed: number; total: number } {
  let passed = 0;
  let total = 0;
  for (const r of report.results) {
    const score = r.scores.find((s) => s.scorer === scorer);
    if (score === undefined) continue;
    total += 1;
    if (score.result.pass) passed += 1;
  }
  return { passed, total };
}

function caseCell(report: ComparableReport, caseId: string, scorer: string): string {
  const r = report.results.find((x) => x.caseId === caseId);
  const score = r?.scores.find((s) => s.scorer === scorer);
  if (score === undefined) return '-';
  return score.result.pass ? 'pass' : 'FAIL';
}

/**
 * Render the A/B comparison as markdown: a per-scorer summary table
 * followed by a per-case breakdown per scorer.
 */
export function renderComparison(
  a: ComparableReport,
  b: ComparableReport,
  labelA: string,
  labelB: string,
): string {
  const lines: string[] = [];
  lines.push('# HaluMem A/B comparison');
  lines.push('');
  lines.push(`- **A:** ${labelA}${a.benchConfig?.provider ? ` (${a.benchConfig.provider})` : ''}`);
  lines.push(`- **B:** ${labelB}${b.benchConfig?.provider ? ` (${b.benchConfig.provider})` : ''}`);
  lines.push('');
  lines.push(`| Scorer | ${labelA} | ${labelB} | delta |`);
  lines.push('| --- | --- | --- | --- |');
  const scorers = [...new Set([...scorerNames(a), ...scorerNames(b)])];
  for (const scorer of scorers) {
    const pa = passCount(a, scorer);
    const pb = passCount(b, scorer);
    const delta = pa.passed - pb.passed;
    const deltaText = delta === 0 ? '0' : delta > 0 ? `+${delta} (A)` : `${-delta} (B)`;
    lines.push(
      `| ${scorer} | ${pa.passed}/${pa.total} | ${pb.passed}/${pb.total} | ${deltaText} |`,
    );
  }
  lines.push(
    `| overall cases | ${a.summary.passed}/${a.summary.total} | ${b.summary.passed}/${b.summary.total} | ` +
      `${a.summary.passed - b.summary.passed === 0 ? '0' : a.summary.passed - b.summary.passed > 0 ? `+${a.summary.passed - b.summary.passed} (A)` : `${b.summary.passed - a.summary.passed} (B)`} |`,
  );
  lines.push('');
  const caseIds = [
    ...new Set([...a.results.map((r) => r.caseId), ...b.results.map((r) => r.caseId)]),
  ];
  for (const scorer of scorers) {
    lines.push(`## ${scorer} - per case`);
    lines.push('');
    lines.push(`| Case | ${labelA} | ${labelB} |`);
    lines.push('| --- | --- | --- |');
    for (const caseId of caseIds) {
      lines.push(`| ${caseId} | ${caseCell(a, caseId, scorer)} | ${caseCell(b, caseId, scorer)} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export async function main(): Promise<void> {
  let args: CompareArgs;
  try {
    args = parseCompareArgs(process.argv);
  } catch (error) {
    console.error(`[benchmark-halumem-compare] ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
    return;
  }
  if (args.help === true) {
    console.log(USAGE);
    return;
  }
  const a = JSON.parse(await readFile(args.a, 'utf8')) as ComparableReport;
  const b = JSON.parse(await readFile(args.b, 'utf8')) as ComparableReport;
  const labelA = args.labelA ?? defaultLabel(a, 'run A');
  const labelB = args.labelB ?? defaultLabel(b, 'run B');
  const markdown = renderComparison(a, b, labelA, labelB);
  console.log(markdown);
  if (args.results !== undefined) {
    await writeFile(args.results, `${markdown}\n`, 'utf8');
    console.log(`[benchmark-halumem-compare] wrote ${args.results}`);
  }
}

if (
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) ===
    (() => {
      try {
        return realpathSync(process.argv[1]);
      } catch {
        return process.argv[1];
      }
    })()
) {
  await main();
}
