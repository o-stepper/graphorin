import { describe, expect, it } from 'vitest';

import { fromIterable } from '../src/loaders/iterable.js';
import { AGENT_RUN_THREW_MARKER, EvalConcurrencyError, runEvals } from '../src/runner.js';
import { exactMatch } from '../src/scorers/code/exact-match.js';
import type { AgentLike } from '../src/types.js';

// Mirrors @graphorin/agent's ConcurrentRunError shape (AG-11) without a
// package dependency: stable `code` discriminator + class name.
class FakeConcurrentRunError extends Error {
  readonly code = 'concurrent-run';
  constructor() {
    super('This Agent instance already has a run in flight.');
    this.name = 'ConcurrentRunError';
  }
}

// A one-run-per-instance agent, like a real Graphorin Agent.
function singleRunAgent(): AgentLike<unknown, unknown> {
  let inFlight = false;
  return {
    async run(input) {
      if (inFlight) throw new FakeConcurrentRunError();
      inFlight = true;
      await new Promise((r) => setTimeout(r, 5));
      inFlight = false;
      return input;
    },
  };
}

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
    // Every caseId is unique - JUnit/HTML reporters can key on them.
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
    // deep-retest-0.13.12 P1: the reason leads with the STABLE marker so
    // benchmark runners can classify the case as infrastructure (the
    // subject never answered), never as a quality miss.
    expect(report.results[0]?.scores[0]?.result.reason?.startsWith(AGENT_RUN_THREW_MARKER)).toBe(
      true,
    );
  });

  it('deep-retest-0.13.12: echoes the case reference answer into results for auditability', async () => {
    const dataset = fromIterable([
      { id: 'with-ref', input: 'a', expected: 'a' },
      { id: 'without-ref', input: 'b' },
    ]);
    const report = await runEvals({
      agent: {
        async run(input: string) {
          return input;
        },
      },
      dataset,
      scorers: [exactMatch()],
    });
    const withRef = report.results.find((r) => r.caseId === 'with-ref');
    const withoutRef = report.results.find((r) => r.caseId === 'without-ref');
    expect(withRef?.expected).toBe('a');
    expect(withoutRef).toBeDefined();
    expect('expected' in (withoutRef ?? {})).toBe(false);

    // The throw path echoes the reference too - a timed-out case can
    // still be adjudicated by hand from the persisted report alone.
    const crashed = await runEvals({
      agent: {
        async run() {
          throw new Error('boom');
        },
      },
      dataset: fromIterable([{ id: 'crash', input: 'x', expected: 'ref-answer' }]),
      scorers: [exactMatch()],
    });
    expect(crashed.results[0]?.expected).toBe('ref-answer');
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
    // The two completed cases survive - Ctrl+C on a long judged run no longer
    // throws away everything that already finished.
    expect(report.results).toHaveLength(2);
    expect(report.summary.total).toBe(2);
    expect(report.results.map((r) => r.caseId)).toEqual(['case-0', 'case-1']);
  });

  it('fails fast with EvalConcurrencyError when a shared single-run agent meets concurrency > 1 (E-19)', async () => {
    const cases = Array.from({ length: 8 }, (_, i) => ({ input: i, expected: i }));
    const promise = runEvals({
      agent: singleRunAgent(),
      dataset: fromIterable(cases),
      scorers: [exactMatch()],
      concurrency: 4,
    });
    // Old behavior: resolved with 7 of 8 cases recorded as generic scorer
    // failures ('agent.run threw: ...run in flight...'). Now the misconfig
    // surfaces distinctly, with the remedy in the message.
    await expect(promise).rejects.toThrow(EvalConcurrencyError);
    await expect(promise).rejects.toThrow(/agentFactory|concurrency: 1/);
  });

  it('preserves the original agent error as `cause` on EvalConcurrencyError', async () => {
    const err = await runEvals({
      agent: singleRunAgent(),
      dataset: fromIterable([
        { input: 'a', expected: 'a' },
        { input: 'b', expected: 'b' },
      ]),
      scorers: [exactMatch()],
      concurrency: 2,
    }).then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(EvalConcurrencyError);
    expect((err as EvalConcurrencyError).cause).toBeInstanceOf(FakeConcurrentRunError);
  });

  it('agentFactory builds one agent per worker so single-run agents pass at concurrency > 1 (E-19)', async () => {
    const cases = Array.from({ length: 8 }, (_, i) => ({ input: i, expected: i }));
    const workerIndexes: number[] = [];
    const report = await runEvals({
      agentFactory: (workerIndex) => {
        workerIndexes.push(workerIndex);
        return singleRunAgent();
      },
      dataset: fromIterable(cases),
      scorers: [exactMatch()],
      concurrency: 4,
    });
    expect(report.summary.total).toBe(8);
    expect(report.summary.passed).toBe(8);
    expect(report.summary.failed).toBe(0);
    // Once per worker, not per case.
    expect(workerIndexes.sort()).toEqual([0, 1, 2, 3]);
  });

  it('supports an async agentFactory and prefers it over a shared agent', async () => {
    const report = await runEvals({
      agent: {
        async run() {
          throw new Error('shared agent must not be used when agentFactory is set');
        },
      },
      agentFactory: async () => singleRunAgent(),
      dataset: fromIterable([{ input: 'a', expected: 'a' }]),
      scorers: [exactMatch()],
    });
    expect(report.summary.passed).toBe(1);
  });

  it('rejects with a TypeError when neither agent nor agentFactory is provided', async () => {
    await expect(
      runEvals({
        dataset: fromIterable([{ input: 'a', expected: 'a' }]),
        scorers: [exactMatch()],
      }),
    ).rejects.toThrow(TypeError);
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
