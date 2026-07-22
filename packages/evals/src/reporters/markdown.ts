/**
 * Markdown reporter. Renders an {@link EvalReport} as a markdown
 * document suitable for embedding in pull-request descriptions or
 * documentation sites.
 *
 * @packageDocumentation
 */

import type { EvalReport } from '@graphorin/observability/eval';

/** @stable */
export function renderMarkdownReport<I, O>(report: EvalReport<I, O>): string {
  const lines: string[] = [];
  lines.push('# graphorin/evals report');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Total cases | ${report.summary.total} |`);
  lines.push(`| Passed | ${report.summary.passed} |`);
  lines.push(`| Failed | ${report.summary.failed} |`);
  lines.push(`| Avg duration (ms) | ${report.summary.avgDurationMs.toFixed(2)} |`);
  // The runner always computes the Wilson interval; rendering it keeps
  // a small-n run from reading as a confident result (a 3-case 100%
  // shows as 100% with a 44-100% interval, not a bare 100%).
  if (report.summary.passRateCi !== undefined && report.summary.total > 0) {
    const rate = pct(report.summary.passed / report.summary.total);
    const lo = pct(report.summary.passRateCi.lo);
    const hi = pct(report.summary.passRateCi.hi);
    lines.push(`| Pass rate (95% CI) | ${rate} (${lo} - ${hi}, n=${report.summary.total}) |`);
  }
  if (report.summary.passHatK !== undefined) {
    const { k, baseCases, value } = report.summary.passHatK;
    lines.push(`| pass^${k} stability | ${pct(value)} over ${baseCases} base cases |`);
  }
  lines.push('');
  lines.push('## Per-scorer');
  lines.push('');
  lines.push('| Scorer | Pass | Fail | Avg score |');
  lines.push('| --- | ---: | ---: | ---: |');
  for (const [scorer, row] of Object.entries(report.summary.byScorer)) {
    const avg = row.avgScore === null ? 'n/a' : row.avgScore.toFixed(4);
    lines.push(`| \`${scorer}\` | ${row.passed} | ${row.failed} | ${avg} |`);
  }
  lines.push('');
  lines.push('## Failures');
  lines.push('');
  let any = false;
  for (const r of report.results) {
    const failures = r.scores.filter((s) => !s.result.pass);
    if (failures.length === 0) continue;
    any = true;
    lines.push(`### \`${r.caseId}\` _(\`${r.durationMs}\` ms)_`);
    lines.push('');
    for (const f of failures) {
      const reason = escapeMarkdownInline(f.result.reason ?? '_no reason_');
      lines.push(`- **${f.scorer}** - ${reason}`);
    }
    lines.push('');
  }
  if (!any) {
    lines.push('_No failures._');
    lines.push('');
  }
  return lines.join('\n');
}

function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

/**
 * Escape characters that would break a Markdown table row when rendered
 * inline. Backslashes must be escaped first so that an existing trailing
 * `\` in the input cannot combine with our inserted `\|` to form a
 * literal pipe. Newlines are flattened to spaces because table cells
 * cannot contain hard line breaks.
 */
function escapeMarkdownInline(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}
