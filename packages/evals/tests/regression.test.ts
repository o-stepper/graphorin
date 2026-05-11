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

  it('flags duration regressions', () => {
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
    const r = detectRegressions(current, baseline);
    expect(r.findings.find((f) => f.kind === 'avg-duration-increase')).toBeDefined();
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
});
