import pkg from '../package.json' with { type: 'json' };
/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Conformance runner (audit item 10): executes every registered
 * framework-floor check, prints one `PASS <id>` / `FAIL <id>: <msg>`
 * line per check, writes the versioned conformance report
 * (`RESULTS.md`, override with `--results <path>`), and exits 1 when
 * any invariant is violated - so `benchmark:ci` stamps on every PR
 * that the promised behaviors still hold.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION as FRAMEWORK_VERSION } from '@graphorin/core';
import { CONFORMANCE_CHECKS, type ConformanceCheck } from './checks.js';

export const VERSION: string = pkg.version;

/** Outcome of one executed check. */
export interface CheckOutcome {
  readonly id: string;
  readonly area: string;
  readonly statement: string;
  readonly ok: boolean;
  /** Violation message; present only when `ok` is `false`. */
  readonly message?: string;
  readonly durationMs: number;
}

/** Aggregated view over a set of outcomes - the runner's exit contract. */
export interface ConformanceSummary {
  readonly passed: number;
  readonly failed: number;
  /** One `PASS <id>` / `FAIL <id>: <message>` line per outcome, in order. */
  readonly lines: ReadonlyArray<string>;
  /** `true` when the runner must exit non-zero. */
  readonly shouldFail: boolean;
}

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function parseArgs(argv: ReadonlyArray<string>): { results: string } {
  let results = join(pkgRoot(), 'RESULTS.md');
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--results' && i + 1 < argv.length) {
      results = argv[++i] ?? results;
    }
  }
  return { results };
}

/** Execute every check in order; a throw becomes a FAIL outcome. */
export async function runConformance(
  checks: ReadonlyArray<ConformanceCheck> = CONFORMANCE_CHECKS,
): Promise<ReadonlyArray<CheckOutcome>> {
  const outcomes: CheckOutcome[] = [];
  for (const check of checks) {
    const startedAt = performance.now();
    try {
      await check.run();
      outcomes.push({
        id: check.id,
        area: check.area,
        statement: check.statement,
        ok: true,
        durationMs: performance.now() - startedAt,
      });
    } catch (cause) {
      outcomes.push({
        id: check.id,
        area: check.area,
        statement: check.statement,
        ok: false,
        message: cause instanceof Error ? cause.message : String(cause),
        durationMs: performance.now() - startedAt,
      });
    }
  }
  return outcomes;
}

/**
 * Pure aggregation over outcomes - unit-tested separately so a
 * deliberately-broken check provably reports as a failure.
 */
export function summarizeOutcomes(outcomes: ReadonlyArray<CheckOutcome>): ConformanceSummary {
  const lines = outcomes.map((o) =>
    o.ok ? `PASS ${o.id}` : `FAIL ${o.id}: ${o.message ?? 'violation'}`,
  );
  const failed = outcomes.filter((o) => !o.ok).length;
  return {
    passed: outcomes.length - failed,
    failed,
    lines,
    shouldFail: failed > 0,
  };
}

/** Render the versioned conformance report (sibling RESULTS.md style). */
export function renderResultsMarkdown(outcomes: ReadonlyArray<CheckOutcome>): string {
  const summary = summarizeOutcomes(outcomes);
  const rows = outcomes
    .map((o) => `| ${o.id} | ${o.area} | ${o.ok ? 'PASS' : 'FAIL'} | ${o.statement} |`)
    .join('\n');
  return [
    '# Framework conformance - results',
    '',
    `**Graphorin** v${FRAMEWORK_VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
    '',
    `_Generated: ${new Date().toISOString()}_`,
    '',
    'Named behavioral invariants (the framework floor), each executed as a deterministic,',
    'offline check against the public API - stub providers, in-memory SQLite, no network.',
    '',
    '| Check | Area | Status | Statement |',
    '| --- | --- | --- | --- |',
    rows,
    '',
    `Checks ${outcomes.length} · Passed ${summary.passed} · Failed ${summary.failed} · Pass ${summary.shouldFail ? 'no' : 'yes'}`,
    '',
  ].join('\n');
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const outcomes = await runConformance();
  const summary = summarizeOutcomes(outcomes);
  for (const line of summary.lines) {
    if (line.startsWith('FAIL ')) {
      console.error(line);
    } else {
      console.log(line);
    }
  }
  console.log(
    `[benchmark-conformance] Graphorin v${FRAMEWORK_VERSION} - checks=${outcomes.length} ` +
      `passed=${summary.passed} failed=${summary.failed}`,
  );
  await mkdir(dirname(args.results), { recursive: true });
  await writeFile(args.results, renderResultsMarkdown(outcomes), 'utf8');
  if (summary.shouldFail) {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
