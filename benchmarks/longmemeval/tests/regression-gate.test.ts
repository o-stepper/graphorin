/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * B2 (negative control): the per-ability regression gate the dispatch CI job
 * runs must provably FAIL on a deliberately regressed run - otherwise an empty
 * `baselines/` plus inert tolerances is gate theater. These exercise the EXACT
 * `REGRESSION_TOLERANCES` the runner gates on (imported, not duplicated), so the
 * proof can never drift from the gate.
 */

import { detectRegressions, type EvalReport, type MemoryEvalInput } from '@graphorin/evals';
import { describe, expect, it } from 'vitest';

import { REGRESSION_TOLERANCES } from '../src/runner.js';

/** A minimal report with a given pass count / total / judge avg-score. */
function report(
  passed: number,
  total: number,
  avgScore: number,
): EvalReport<MemoryEvalInput, string> {
  return {
    results: [],
    summary: {
      total,
      passed,
      failed: total - passed,
      avgDurationMs: 1,
      byScorer: { 'llm-judge-j': { passed, failed: total - passed, avgScore } },
    },
  };
}

describe('B2: regression-gate negative control', () => {
  it('does not flag an identical run (positive control)', () => {
    const baseline = report(10, 10, 0.9);
    expect(detectRegressions(baseline, baseline, REGRESSION_TOLERANCES).hasRegressions).toBe(false);
  });

  it('FAILS on a deliberately regressed run - the gate is not theater', () => {
    const baseline = report(10, 10, 0.9); // 100% pass, 0.9 avg
    const regressed = report(5, 10, 0.5); // 50% pass, 0.5 avg - both far past tolerance
    const r = detectRegressions(regressed, baseline, REGRESSION_TOLERANCES);
    expect(r.hasRegressions).toBe(true);
    expect(r.findings.some((f) => f.kind === 'pass-rate-drop')).toBe(true);
    expect(r.findings.some((f) => f.kind === 'avg-score-drop')).toBe(true);
  });

  it('ignores a pure duration increase (quality-only gate, EB-4)', () => {
    const baseline = report(10, 10, 0.9);
    const slower: EvalReport<MemoryEvalInput, string> = {
      ...baseline,
      summary: { ...baseline.summary, avgDurationMs: 999_999 },
    };
    expect(detectRegressions(slower, baseline, REGRESSION_TOLERANCES).hasRegressions).toBe(false);
  });
});
