/**
 * JUnit XML reporter. Renders an {@link EvalReport} as a JUnit
 * `<testsuite>` document so CI systems (GitHub Actions, GitLab,
 * CircleCI, Jenkins) can render pass / fail counts in the standard
 * test-report widget.
 *
 * @packageDocumentation
 */

import type { EvalReport } from '@graphorin/observability/eval';

/** @stable */
export function renderJunitReport<I, O>(
  report: EvalReport<I, O>,
  options: { readonly suiteName?: string } = {},
): string {
  const suiteName = options.suiteName ?? 'graphorin-evals';
  const totalTests = report.results.reduce((acc, r) => acc + r.scores.length, 0);
  const failures = report.results.reduce(
    (acc, r) => acc + r.scores.filter((s) => !s.result.pass).length,
    0,
  );
  const totalTime = (report.summary.avgDurationMs * report.summary.total) / 1000;
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<testsuite name="${escapeXml(suiteName)}" tests="${totalTests}" failures="${failures}" time="${totalTime.toFixed(3)}">`,
  );
  for (const r of report.results) {
    for (const { scorer, result } of r.scores) {
      const time = (r.durationMs / 1000).toFixed(3);
      lines.push(
        `  <testcase classname="${escapeXml(scorer)}" name="${escapeXml(r.caseId)}" time="${time}">`,
      );
      if (!result.pass) {
        const message = escapeXml(result.reason ?? 'failed');
        lines.push(`    <failure message="${message}">${message}</failure>`);
      }
      lines.push('  </testcase>');
    }
  }
  lines.push('</testsuite>');
  return lines.join('\n');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
