/**
 * HTML reporter. Renders an {@link EvalReport} as a self-contained
 * HTML document — no external CSS / JS — so artifact viewers can
 * render it directly. Designed to fit on a single page; for richer
 * dashboards consume the JSON reporter instead.
 *
 * @packageDocumentation
 */

import type { EvalReport } from '@graphorin/observability/eval';

/** @stable */
export function renderHtmlReport<I, O>(
  report: EvalReport<I, O>,
  options: { readonly title?: string } = {},
): string {
  const title = escapeHtml(options.title ?? 'graphorin/evals report');
  const summary = report.summary;
  const passRate = summary.total === 0 ? 0 : (summary.passed / summary.total) * 100;
  const scorerRows = Object.entries(summary.byScorer)
    .map(([scorer, row]) => {
      const avg = row.avgScore === null ? 'n/a' : row.avgScore.toFixed(4);
      return `<tr><td><code>${escapeHtml(scorer)}</code></td><td>${row.passed}</td><td>${row.failed}</td><td>${avg}</td></tr>`;
    })
    .join('');
  const failureRows = report.results
    .flatMap((r) => {
      const failures = r.scores.filter((s) => !s.result.pass);
      return failures.map(
        (f) =>
          `<tr><td><code>${escapeHtml(r.caseId)}</code></td><td><code>${escapeHtml(f.scorer)}</code></td><td>${escapeHtml(f.result.reason ?? '')}</td></tr>`,
      );
    })
    .join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; max-width: 64rem; color: #1a1a1a; }
  h1 { margin-top: 0; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { padding: 0.4rem 0.6rem; text-align: left; border-bottom: 1px solid #e5e5e5; }
  th { background: #f5f5f5; }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr)); gap: 0.6rem; }
  .summary-card { background: #f5f5f5; padding: 0.8rem; border-radius: 6px; }
  .summary-card .label { font-size: 0.8rem; text-transform: uppercase; color: #666; letter-spacing: 0.04em; }
  .summary-card .value { font-size: 1.4rem; font-weight: 600; }
  code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 0.9rem; }
</style>
</head>
<body>
<h1>${title}</h1>
<div class="summary-grid">
  <div class="summary-card"><div class="label">Total</div><div class="value">${summary.total}</div></div>
  <div class="summary-card"><div class="label">Passed</div><div class="value">${summary.passed}</div></div>
  <div class="summary-card"><div class="label">Failed</div><div class="value">${summary.failed}</div></div>
  <div class="summary-card"><div class="label">Pass rate</div><div class="value">${passRate.toFixed(1)}%</div></div>
  <div class="summary-card"><div class="label">Avg ms</div><div class="value">${summary.avgDurationMs.toFixed(0)}</div></div>
</div>
<h2>Per-scorer</h2>
<table>
  <thead><tr><th>Scorer</th><th>Pass</th><th>Fail</th><th>Avg score</th></tr></thead>
  <tbody>${scorerRows || '<tr><td colspan="4">No scorers.</td></tr>'}</tbody>
</table>
<h2>Failures</h2>
<table>
  <thead><tr><th>Case</th><th>Scorer</th><th>Reason</th></tr></thead>
  <tbody>${failureRows || '<tr><td colspan="3">No failures.</td></tr>'}</tbody>
</table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
