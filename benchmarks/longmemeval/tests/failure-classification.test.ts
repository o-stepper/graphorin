/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * deep-retest 0.13.12 P1: LongMemEval used to store `agent.run threw:
 * <provider timeout>` as an ordinary failed answer, and `--gate-on
 * regressions` without a baseline exited 0 - automation read a green
 * benchmark process while the evaluated system produced NO answers.
 * These tests pin the marker-based classification the runner now
 * gates on (mirroring the HaluMem INFRASTRUCTURE_FAILED/JUDGE_FAILED
 * semantics).
 */

import {
  AGENT_RUN_THREW_MARKER,
  type EvalReport,
  JUDGE_OFF_FORMAT_MARKER,
  JUDGE_RETRY_MARKER,
} from '@graphorin/evals';
import { describe, expect, it } from 'vitest';

import { countMarkedCases } from '../src/runner.js';

function reportWith(
  cases: ReadonlyArray<{ caseId: string; reasons: ReadonlyArray<string | undefined> }>,
): EvalReport<unknown, unknown> {
  return {
    results: cases.map((c) => ({
      caseId: c.caseId,
      input: {},
      output: undefined,
      durationMs: 1,
      scores: c.reasons.map((reason, i) => ({
        scorer: `scorer-${i}`,
        result: { pass: reason === undefined, ...(reason !== undefined ? { reason } : {}) },
      })),
    })),
    summary: {
      total: cases.length,
      passed: 0,
      failed: cases.length,
      avgDurationMs: 1,
      byScorer: {},
    },
  };
}

describe('deep-retest-0.13.12 P1: infrastructure/judge classification', () => {
  it('counts agent.run throws as infrastructure, not quality', () => {
    const report = reportWith([
      {
        caseId: 'timeout-1',
        reasons: [`${AGENT_RUN_THREW_MARKER} HTTP 0 request timed out after 120000 ms`],
      },
      { caseId: 'honest-miss', reasons: ['judge score 3 < threshold 7'] },
      { caseId: 'green', reasons: [undefined] },
    ]);
    const infra = countMarkedCases(report, AGENT_RUN_THREW_MARKER);
    expect(infra.count).toBe(1);
    expect(infra.caseIds).toEqual(['timeout-1']);
  });

  it('counts judge off-format failures separately from subject quality', () => {
    const report = reportWith([
      {
        caseId: 'ungraded',
        reasons: [
          `Scorer "llm-judge-j" threw: llm-judge-j: ${JUDGE_OFF_FORMAT_MARKER} judge reply`,
        ],
      },
      { caseId: 'honest-miss', reasons: ['judge score 3 < threshold 7'] },
    ]);
    const judge = countMarkedCases(report, JUDGE_OFF_FORMAT_MARKER);
    expect(judge.count).toBe(1);
    expect(judge.caseIds).toEqual(['ungraded']);
  });

  it('counts recovered judge retries without classifying them as failures', () => {
    const report = reportWith([
      { caseId: 'recovered', reasons: [`${JUDGE_RETRY_MARKER} 1 (recovered)`] },
      { caseId: 'clean', reasons: [undefined] },
    ]);
    const retried = countMarkedCases(report, JUDGE_RETRY_MARKER);
    expect(retried.count).toBe(1);
    expect(retried.caseIds).toEqual(['recovered']);
    // Disjoint from the failure classes.
    expect(countMarkedCases(report, AGENT_RUN_THREW_MARKER).count).toBe(0);
    expect(countMarkedCases(report, JUDGE_OFF_FORMAT_MARKER).count).toBe(0);
  });

  it('a marker match on ANY scorer of a case counts the case exactly once', () => {
    const report = reportWith([
      {
        caseId: 'multi-scorer',
        reasons: [
          `${AGENT_RUN_THREW_MARKER} HTTP 503 upstream unavailable`,
          `${AGENT_RUN_THREW_MARKER} HTTP 503 upstream unavailable`,
        ],
      },
    ]);
    const infra = countMarkedCases(report, AGENT_RUN_THREW_MARKER);
    expect(infra.count).toBe(1);
    expect(infra.caseIds).toEqual(['multi-scorer']);
  });
});
