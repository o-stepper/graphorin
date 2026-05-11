import { describe, expect, it } from 'vitest';

import { runEval, type Scorer } from '../../src/eval/index.js';

describe('@graphorin/observability/eval — runEval', () => {
  it('runs sequentially, applies scorers, and aggregates a summary', async () => {
    const lengthScorer: Scorer<string, number> = {
      name: 'length',
      async score({ output, case: c }) {
        const expected = c.expected ?? 0;
        return { pass: output === expected, score: output === expected ? 1 : 0 };
      },
    };
    const report = await runEval({
      agent: { run: async (input: string) => input.length },
      dataset: {
        cases: [
          { id: 'one', input: 'hello', expected: 5 },
          { id: 'two', input: 'hi', expected: 3 },
        ],
      },
      scorers: [lengthScorer],
    });
    expect(report.results).toHaveLength(2);
    expect(report.summary.total).toBe(2);
    expect(report.summary.passed).toBe(1);
    expect(report.summary.failed).toBe(1);
    expect(report.summary.byScorer['length']?.passed).toBe(1);
  });

  it('catches scorer exceptions and reports them as failures', async () => {
    const broken: Scorer<string, string> = {
      name: 'broken',
      async score(): Promise<never> {
        throw new Error('scorer failed');
      },
    };
    const report = await runEval({
      agent: { run: async (i: string) => i },
      dataset: { cases: [{ id: 'a', input: 'x', expected: 'x' }] },
      scorers: [broken],
    });
    expect(report.summary.failed).toBe(1);
    expect(report.results[0]?.scores[0]?.result.pass).toBe(false);
    expect(report.results[0]?.scores[0]?.result.reason).toContain('broken');
  });

  it('honours iterations', async () => {
    let runs = 0;
    const report = await runEval({
      agent: {
        run: async (_i: number) => {
          runs += 1;
          return 1;
        },
      },
      dataset: { cases: [{ input: 1, expected: 1 }] },
      scorers: [
        {
          name: 'noop',
          async score(): Promise<{ pass: boolean }> {
            return { pass: true };
          },
        },
      ],
      iterations: 3,
    });
    expect(runs).toBe(3);
    expect(report.results).toHaveLength(3);
  });

  it('aborts when the supplied AbortSignal fires', async () => {
    const ctl = new AbortController();
    ctl.abort(new Error('cancelled'));
    await expect(
      runEval({
        agent: { run: async (i: string) => i },
        dataset: { cases: [{ input: 'a' }] },
        scorers: [],
        signal: ctl.signal,
      }),
    ).rejects.toThrow(/cancelled/);
  });

  it('returns zero summary when dataset is empty', async () => {
    const report = await runEval({
      agent: { run: async (i: string) => i },
      dataset: { cases: [] },
      scorers: [],
    });
    expect(report.summary.total).toBe(0);
    expect(report.summary.avgDurationMs).toBe(0);
  });
});
