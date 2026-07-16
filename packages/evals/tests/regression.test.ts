import { describe, expect, it } from 'vitest';

import { detectRegressions } from '../src/regression.js';
import type { EvalReport } from '../src/types.js';

function makeReport(overrides: {
  total: number;
  passed: number;
  avgDurationMs: number;
  byScorer: Record<string, { passed: number; failed: number; avgScore: number | null }>;
}): EvalReport<unknown, unknown> {
  return {
    results: [],
    summary: {
      total: overrides.total,
      passed: overrides.passed,
      failed: overrides.total - overrides.passed,
      avgDurationMs: overrides.avgDurationMs,
      byScorer: Object.freeze(overrides.byScorer),
    },
  };
}

describe('detectRegressions', () => {
  it('reports no regressions when current matches baseline', () => {
    const report = makeReport({
      total: 10,
      passed: 9,
      avgDurationMs: 100,
      byScorer: { 'exact-match': { passed: 9, failed: 1, avgScore: 0.9 } },
    });
    const r = detectRegressions(report, report);
    expect(r.hasRegressions).toBe(false);
    expect(r.findings).toEqual([]);
  });

  it('flags pass-rate drops beyond tolerance', () => {
    const baseline = makeReport({
      total: 10,
      passed: 10,
      avgDurationMs: 100,
      byScorer: { em: { passed: 10, failed: 0, avgScore: 1 } },
    });
    const current = makeReport({
      total: 10,
      passed: 7,
      avgDurationMs: 100,
      byScorer: { em: { passed: 7, failed: 3, avgScore: 0.7 } },
    });
    const r = detectRegressions(current, baseline);
    expect(r.hasRegressions).toBe(true);
    const passDropFinding = r.findings.find((f) => f.kind === 'pass-rate-drop');
    expect(passDropFinding?.delta).toBeLessThan(0);
  });

  it('flags avg-score drops per scorer', () => {
    const baseline = makeReport({
      total: 10,
      passed: 10,
      avgDurationMs: 100,
      byScorer: { judge: { passed: 10, failed: 0, avgScore: 0.95 } },
    });
    const current = makeReport({
      total: 10,
      passed: 10,
      avgDurationMs: 100,
      byScorer: { judge: { passed: 10, failed: 0, avgScore: 0.7 } },
    });
    const r = detectRegressions(current, baseline);
    expect(r.findings.find((f) => f.kind === 'avg-score-drop')).toBeDefined();
  });

  it('flags duration regressions when an explicit ms budget is set (opt-in)', () => {
    const baseline = makeReport({
      total: 5,
      passed: 5,
      avgDurationMs: 100,
      byScorer: { em: { passed: 5, failed: 0, avgScore: 1 } },
    });
    const current = makeReport({
      total: 5,
      passed: 5,
      avgDurationMs: 1500,
      byScorer: { em: { passed: 5, failed: 0, avgScore: 1 } },
    });
    const r = detectRegressions(current, baseline, { maxAvgDurationIncreaseMs: 250 });
    expect(r.findings.find((f) => f.kind === 'avg-duration-increase')).toBeDefined();
  });

  it('does NOT flag duration regressions by default - the gate is opt-in (EB-4)', () => {
    // avgDuration jumps 100ms -> 5000ms with pass-rate/scores unchanged. The
    // absolute duration gate is environment-sensitive (workstation baseline vs
    // slow CI runner, or real LLM latency jitter), so it must be off unless a
    // caller opts in with an explicit ms budget.
    const baseline = makeReport({
      total: 5,
      passed: 5,
      avgDurationMs: 100,
      byScorer: { em: { passed: 5, failed: 0, avgScore: 1 } },
    });
    const current = makeReport({
      total: 5,
      passed: 5,
      avgDurationMs: 5000,
      byScorer: { em: { passed: 5, failed: 0, avgScore: 1 } },
    });
    const r = detectRegressions(current, baseline);
    expect(r.findings.find((f) => f.kind === 'avg-duration-increase')).toBeUndefined();
    expect(r.hasRegressions).toBe(false);
  });

  it('flags scorers that disappeared from the current run', () => {
    const baseline = makeReport({
      total: 1,
      passed: 1,
      avgDurationMs: 0,
      byScorer: {
        gone: { passed: 1, failed: 0, avgScore: 1 },
        kept: { passed: 1, failed: 0, avgScore: 1 },
      },
    });
    const current = makeReport({
      total: 1,
      passed: 1,
      avgDurationMs: 0,
      byScorer: { kept: { passed: 1, failed: 0, avgScore: 1 } },
    });
    const r = detectRegressions(current, baseline);
    expect(
      r.findings.find((f) => f.kind === 'scorer-removed' && f.scorer === 'gone'),
    ).toBeDefined();
  });

  it('respects custom tolerances', () => {
    const baseline = makeReport({
      total: 10,
      passed: 10,
      avgDurationMs: 100,
      byScorer: { em: { passed: 10, failed: 0, avgScore: 1 } },
    });
    const current = makeReport({
      total: 10,
      passed: 8,
      avgDurationMs: 100,
      byScorer: { em: { passed: 8, failed: 2, avgScore: 0.8 } },
    });
    const r = detectRegressions(current, baseline, {
      maxPassRateDropPct: 30,
      maxAvgScoreDrop: 0.5,
    });
    expect(r.hasRegressions).toBe(false);
  });

  // EVALS-REP-01: the boundary is exclusive and float-robust. A pass-rate drop
  // that lands EXACTLY on the tolerance must not flag, even when float
  // subtraction overshoots by ~1e-15 (e.g. (1 - 0.95) * 100 = 5.000000000000004).
  it('does NOT flag a pass-rate drop that lands exactly on the tolerance', () => {
    const baseline = makeReport({
      total: 20,
      passed: 20,
      avgDurationMs: 100,
      byScorer: { em: { passed: 20, failed: 0, avgScore: 1 } },
    });
    const current = makeReport({
      total: 20,
      passed: 19, // 95% -> a 5.00pp drop, computed as 5.000000000000004
      avgDurationMs: 100,
      byScorer: { em: { passed: 19, failed: 1, avgScore: 0.95 } },
    });
    // Sanity: the raw delta really does overshoot, so a naive `> 5` would flag.
    expect((1 - 19 / 20) * 100).toBeGreaterThan(5);
    const r = detectRegressions(current, baseline, { maxPassRateDropPct: 5 });
    expect(r.hasRegressions).toBe(false);
  });

  it('DOES flag a pass-rate drop that genuinely exceeds the tolerance', () => {
    const baseline = makeReport({
      total: 20,
      passed: 20,
      avgDurationMs: 100,
      byScorer: { em: { passed: 20, failed: 0, avgScore: 1 } },
    });
    const current = makeReport({
      total: 20,
      passed: 18, // 90% -> a 10pp drop, well beyond a 5pp tolerance
      avgDurationMs: 100,
      byScorer: { em: { passed: 18, failed: 2, avgScore: 0.9 } },
    });
    const r = detectRegressions(current, baseline, { maxPassRateDropPct: 5 });
    expect(r.hasRegressions).toBe(true);
    expect(r.findings.some((f) => f.kind === 'pass-rate-drop')).toBe(true);
  });

  // EVALS-REP-01: same exclusive+epsilon contract on the per-scorer avg-score gate.
  it('does NOT flag an avg-score drop that lands exactly on the tolerance', () => {
    const baseline = makeReport({
      total: 10,
      passed: 10,
      avgDurationMs: 100,
      byScorer: { em: { passed: 10, failed: 0, avgScore: 0.9 } },
    });
    const current = makeReport({
      total: 10,
      passed: 10,
      avgDurationMs: 100,
      byScorer: { em: { passed: 10, failed: 0, avgScore: 0.7 } }, // 0.9 - 0.7 = 0.20000000000000007
    });
    // Sanity: the raw drop overshoots 0.2, so a naive `> 0.2` would flag.
    expect(0.9 - 0.7).toBeGreaterThan(0.2);
    const r = detectRegressions(current, baseline, { maxAvgScoreDrop: 0.2 });
    expect(r.findings.some((f) => f.kind === 'avg-score-drop')).toBe(false);
  });
});
