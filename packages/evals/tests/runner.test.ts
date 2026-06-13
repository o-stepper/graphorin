import { describe, expect, it } from 'vitest';

import { fromIterable } from '../src/loaders/iterable.js';
import { runEvals } from '../src/runner.js';
import { exactMatch } from '../src/scorers/code/exact-match.js';

describe('runEvals', () => {
  it('runs every case sequentially by default and aggregates the report', async () => {
    const dataset = fromIterable([
      { input: 'a', expected: 'a' },
      { input: 'b', expected: 'b' },
    ]);
    const report = await runEvals({
      agent: { run: async (input) => input },
      dataset,
      scorers: [exactMatch()],
    });
    expect(report.summary.total).toBe(2);
    expect(report.summary.passed).toBe(2);
    expect(report.summary.failed).toBe(0);
    expect(report.summary.byScorer['exact-match']?.passed).toBe(2);
  });

  it('disambiguates an explicit caseId per iteration so report ids are unique (EB-6)', async () => {
    const dataset = fromIterable([{ id: 'sample', input: 'a', expected: 'a' }]);
    const report = await runEvals({
      agent: { run: async (input) => input },
      dataset,
      scorers: [exactMatch()],
      iterations: 3,
    });
    expect(report.summary.total).toBe(3);
    const ids = report.results.map((r) => r.caseId).sort();
    expect(ids).toEqual(['sample-iter-0', 'sample-iter-1', 'sample-iter-2']);
    // Every caseId is unique — JUnit/HTML reporters can key on them.
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('runs in parallel when concurrency > 1', async () => {
    const cases = Array.from({ length: 8 }, (_, i) => ({ input: i, expected: i }));
    const dataset = fromIterable(cases);
    let inFlight = 0;
    let maxInFlight = 0;
    const report = await runEvals({
      agent: {
        async run(input) {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise((r) => setTimeout(r, 5));
          inFlight -= 1;
          return input;
        },
      },
      dataset,
      scorers: [exactMatch()],
      concurrency: 4,
    });
    expect(report.summary.total).toBe(8);
    expect(report.summary.passed).toBe(8);
    expect(maxInFlight).toBeGreaterThan(1);
    expect(maxInFlight).toBeLessThanOrEqual(4);
  });

  it('captures agent.run exceptions as a failed case', async () => {
    const dataset = fromIterable([{ input: 'boom', expected: 'boom' }]);
    const report = await runEvals({
      agent: {
        async run() {
          throw new Error('agent crashed');
        },
      },
      dataset,
      scorers: [exactMatch()],
    });
    expect(report.summary.failed).toBe(1);
    expect(report.results[0]?.scores[0]?.result.reason).toMatch(/agent crashed/);
  });

  it('emits onProgress events for every case', async () => {
    const dataset = fromIterable([
      { input: 'a', expected: 'a' },
      { input: 'b', expected: 'a' },
    ]);
    const events: { caseId: string; passed: boolean }[] = [];
    await runEvals({
      agent: { run: async (input) => input },
      dataset,
      scorers: [exactMatch()],
      onProgress: (e) => events.push({ caseId: e.caseId, passed: e.passed }),
    });
    expect(events).toHaveLength(2);
    expect(events.find((e) => e.passed === false)).toBeDefined();
  });

  it('throws on an aborted signal when throwOnAbort is set (opt-in)', async () => {
    const controller = new AbortController();
    const dataset = fromIterable([
      { input: 'a', expected: 'a' },
      { input: 'b', expected: 'b' },
    ]);
    let calls = 0;
    await expect(
      runEvals({
        agent: {
          async run(input) {
            calls += 1;
            if (calls === 1) controller.abort();
            return input;
          },
        },
        dataset,
        scorers: [exactMatch()],
        signal: controller.signal,
        throwOnAbort: true,
      }),
    ).rejects.toThrow(/aborted/);
  });

  it('returns a partial report with aborted:true instead of discarding completed work (EB-14)', async () => {
    const controller = new AbortController();
    const dataset = fromIterable([
      { input: 'a', expected: 'a' },
      { input: 'b', expected: 'b' },
      { input: 'c', expected: 'c' },
    ]);
    let calls = 0;
    const report = await runEvals({
      agent: {
        async run(input) {
          calls += 1;
          // Abort after the 2nd case finishes; the 3rd is never dispatched.
          if (calls === 2) controller.abort();
          return input;
        },
      },
      dataset,
      scorers: [exactMatch()],
      signal: controller.signal,
    });
    expect(report.aborted).toBe(true);
    // The two completed cases survive — Ctrl+C on a long judged run no longer
    // throws away everything that already finished.
    expect(report.results).toHaveLength(2);
    expect(report.summary.total).toBe(2);
    expect(report.results.map((r) => r.caseId)).toEqual(['case-0', 'case-1']);
  });

  it('returns an empty summary when the dataset is empty', async () => {
    const report = await runEvals({
      agent: { run: async (input) => input },
      dataset: fromIterable<string>([]),
      scorers: [exactMatch()],
    });
    expect(report.summary.total).toBe(0);
    expect(report.summary.passed).toBe(0);
  });
});
