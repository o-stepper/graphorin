/**
 * Compares two `EvalReport`s — typically the freshly-produced report
 * vs a stored baseline — and lists every metric that regressed beyond
 * the configured tolerance.
 *
 * @packageDocumentation
 */

import type {
  EvalReport,
  RegressionFinding,
  RegressionOptions,
  RegressionReport,
} from './types.js';

const DEFAULT_PASS_RATE_DROP_PCT = 5;
const DEFAULT_AVG_SCORE_DROP = 0.05;
// EB-4: the avg-duration gate is OPT-IN (default off). Absolute wall-clock
// budgets are environment-sensitive — a baseline recorded on a fast
// workstation vs a loaded CI runner, or real LLM-latency jitter of whole
// seconds, would flag spurious "regressions". Callers that genuinely want a
// duration budget pass an explicit finite `maxAvgDurationIncreaseMs`.
const DEFAULT_AVG_DURATION_INCREASE_MS = Number.POSITIVE_INFINITY;

/**
 * Detect regressions between `current` and `baseline` reports.
 *
 * @stable
 */
export function detectRegressions<I, O>(
  current: EvalReport<I, O>,
  baseline: EvalReport<I, O>,
  options: RegressionOptions = {},
): RegressionReport<I, O> {
  const maxPassRateDropPct = options.maxPassRateDropPct ?? DEFAULT_PASS_RATE_DROP_PCT;
  const maxAvgScoreDrop = options.maxAvgScoreDrop ?? DEFAULT_AVG_SCORE_DROP;
  const maxAvgDurationIncreaseMs =
    options.maxAvgDurationIncreaseMs ?? DEFAULT_AVG_DURATION_INCREASE_MS;
  const findings: RegressionFinding[] = [];

  const currentPassRate = total(current) === 0 ? 0 : current.summary.passed / total(current);
  const baselinePassRate = total(baseline) === 0 ? 0 : baseline.summary.passed / total(baseline);
  const passRateDropPct = (baselinePassRate - currentPassRate) * 100;
  if (passRateDropPct > maxPassRateDropPct) {
    findings.push({
      kind: 'pass-rate-drop',
      message:
        `pass rate dropped by ${passRateDropPct.toFixed(2)}% ` +
        `(${(currentPassRate * 100).toFixed(2)}% < baseline ${(baselinePassRate * 100).toFixed(2)}% ` +
        `− tolerance ${maxPassRateDropPct.toFixed(2)}%).`,
      delta: -passRateDropPct,
    });
  }

  const durationDelta = current.summary.avgDurationMs - baseline.summary.avgDurationMs;
  if (durationDelta > maxAvgDurationIncreaseMs) {
    findings.push({
      kind: 'avg-duration-increase',
      message:
        `avg duration increased by ${durationDelta.toFixed(2)} ms ` +
        `(${current.summary.avgDurationMs.toFixed(2)} ms > baseline ` +
        `${baseline.summary.avgDurationMs.toFixed(2)} ms − tolerance ${maxAvgDurationIncreaseMs} ms).`,
      delta: durationDelta,
    });
  }

  for (const [scorer, baselineRow] of Object.entries(baseline.summary.byScorer)) {
    const currentRow = current.summary.byScorer[scorer];
    if (currentRow === undefined) {
      findings.push({
        kind: 'scorer-removed',
        scorer,
        message: `scorer '${scorer}' is in the baseline but missing from the current run.`,
        delta: Number.NaN,
      });
      continue;
    }
    if (typeof baselineRow.avgScore === 'number' && typeof currentRow.avgScore === 'number') {
      const drop = baselineRow.avgScore - currentRow.avgScore;
      if (drop > maxAvgScoreDrop) {
        findings.push({
          kind: 'avg-score-drop',
          scorer,
          message:
            `'${scorer}' avg score dropped by ${drop.toFixed(4)} ` +
            `(${currentRow.avgScore.toFixed(4)} < baseline ${baselineRow.avgScore.toFixed(4)} ` +
            `− tolerance ${maxAvgScoreDrop}).`,
          delta: -drop,
        });
      }
    }
  }

  return {
    hasRegressions: findings.length > 0,
    findings,
    current,
    baseline,
  };
}

function total<I, O>(r: EvalReport<I, O>): number {
  return r.summary.total;
}
