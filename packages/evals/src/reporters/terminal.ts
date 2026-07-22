/**
 * Terminal reporter. Renders an {@link EvalReport} as plain ANSI-free
 * text suitable for stdout / CI logs.
 *
 * @packageDocumentation
 */

import type { EvalReport } from '@graphorin/observability/eval';

/** @stable */
export function renderTerminalReport<I, O>(report: EvalReport<I, O>): string {
  const lines: string[] = [];
  const { summary } = report;
  lines.push('graphorin/evals - terminal report');
  lines.push('=================================');
  lines.push(`total:   ${summary.total}`);
  lines.push(`passed:  ${summary.passed}`);
  lines.push(`failed:  ${summary.failed}`);
  lines.push(`avg ms:  ${summary.avgDurationMs.toFixed(2)}`);
  // Render the uncertainty the runner already computes - a small-n run
  // must not read as a confident result.
  if (summary.passRateCi !== undefined && summary.total > 0) {
    const rate = ((summary.passed / summary.total) * 100).toFixed(1);
    const lo = (summary.passRateCi.lo * 100).toFixed(1);
    const hi = (summary.passRateCi.hi * 100).toFixed(1);
    lines.push(`pass:    ${rate}% (95% CI ${lo}%-${hi}%, n=${summary.total})`);
  }
  if (summary.passHatK !== undefined) {
    const { k, baseCases, value } = summary.passHatK;
    lines.push(`pass^${k}:  ${(value * 100).toFixed(1)}% over ${baseCases} base cases`);
  }
  lines.push('');
  lines.push('per-scorer:');
  for (const [scorer, row] of Object.entries(summary.byScorer)) {
    const avg = row.avgScore === null ? 'n/a' : row.avgScore.toFixed(4);
    lines.push(
      `  ${scorer.padEnd(24)}  pass=${row.passed.toString().padStart(4)}  fail=${row.failed.toString().padStart(4)}  avg=${avg}`,
    );
  }
  lines.push('');
  lines.push('failures (first 10):');
  let failuresShown = 0;
  for (const r of report.results) {
    if (failuresShown >= 10) break;
    const failures = r.scores.filter((s) => !s.result.pass);
    if (failures.length === 0) continue;
    failuresShown += 1;
    lines.push(`  • ${r.caseId} (${r.durationMs} ms)`);
    for (const f of failures) {
      const reason = f.result.reason ?? '<no reason>';
      lines.push(`      ${f.scorer}: ${reason}`);
    }
  }
  if (failuresShown === 0) {
    lines.push('  (none)');
  }
  return lines.join('\n');
}
