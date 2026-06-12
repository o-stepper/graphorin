/**
 * WF-16: adversarial specs for the durable-engine failure modes — each
 * written as the regression spec for its finding (WF-1/2/3/8/9/12/14)
 * and RED on the pre-fix engine.
 */

import { collect } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  createNode,
  createWorkflow,
  Directive,
  Dispatch,
  InMemoryCheckpointStore,
  latestValue,
  pause,
} from '../src/index.js';

interface S {
  log?: string[];
  a?: string;
  b?: string;
  decision?: string;
  second?: string;
}

describe('WF-1 — the resumable frontier survives suspension', () => {
  it('a sibling that COMPLETED while another paused still fires its edges after resume', async () => {
    const ran: string[] = [];
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<S>({
      name: 'frontier-sibling',
      channels: {
        a: latestValue<string>(),
        b: latestValue<string>(),
        decision: latestValue<string>(),
      },
      nodes: {
        pauser: createNode<S>({
          name: 'pauser',
          run: () => {
            const d = pause<string, string>('need-approval');
            return { decision: d };
          },
        }),
        sibling: createNode<S>({
          name: 'sibling',
          run: () => {
            ran.push('sibling');
            return { a: 'sibling-done' };
          },
        }),
        afterSibling: createNode<S>({
          name: 'afterSibling',
          run: () => {
            ran.push('afterSibling');
            return { b: 'after-sibling' };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'pauser' },
        { from: '__start__', to: 'sibling' },
        { from: 'sibling', to: 'afterSibling' },
        { from: 'pauser', to: '__end__' },
        { from: 'afterSibling', to: '__end__' },
      ],
      checkpointStore: store,
    });

    const first = await collect(wf.execute({}, { threadId: 'fs-1' }));
    expect(first.at(-1)?.type).toBe('workflow.suspended');
    expect(ran).toEqual(['sibling']); // sibling completed in the suspend step

    // Fresh instance over the same store (process-restart simulation).
    const wf2 = createWorkflow<S>({
      name: 'frontier-sibling',
      channels: {
        a: latestValue<string>(),
        b: latestValue<string>(),
        decision: latestValue<string>(),
      },
      nodes: {
        pauser: createNode<S>({
          name: 'pauser',
          run: () => ({ decision: pause<string, string>('x') }),
        }),
        sibling: createNode<S>({
          name: 'sibling',
          run: () => {
            ran.push('sibling');
            return { a: 'sibling-done' };
          },
        }),
        afterSibling: createNode<S>({
          name: 'afterSibling',
          run: () => {
            ran.push('afterSibling');
            return { b: 'after-sibling' };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'pauser' },
        { from: '__start__', to: 'sibling' },
        { from: 'sibling', to: 'afterSibling' },
        { from: 'pauser', to: '__end__' },
        { from: 'afterSibling', to: '__end__' },
      ],
      checkpointStore: store,
    });
    const resumed = await collect(wf2.resume('fs-1', new Directive({ resume: 'ok' })));
    const end = resumed.at(-1);
    expect(end?.type).toBe('workflow.end');
    // WF-1(b): the completed sibling's outgoing edge fired post-resume.
    expect(ran).toEqual(['sibling', 'afterSibling']);
    if (end?.type === 'workflow.end') {
      expect(end.state.b).toBe('after-sibling');
      expect(end.state.decision).toBe('ok');
    }
  });

  it('Dispatch tasks scheduled in the suspend step survive the resume', async () => {
    const ran: string[] = [];
    const store = new InMemoryCheckpointStore();
    const build = () =>
      createWorkflow<S>({
        name: 'frontier-dispatch',
        channels: { a: latestValue<string>(), decision: latestValue<string>() },
        nodes: {
          dispatcher: createNode<S>({
            name: 'dispatcher',
            run: () => {
              ran.push('dispatcher');
              return new Dispatch('dynamic', { payload: 1 });
            },
          }),
          pauser: createNode<S>({
            name: 'pauser',
            run: () => ({ decision: pause<string, string>('gate') }),
          }),
          dynamic: createNode<S>({
            name: 'dynamic',
            run: () => {
              ran.push('dynamic');
              return { a: 'dynamic-ran' };
            },
          }),
        },
        edges: [
          { from: '__start__', to: 'dispatcher' },
          { from: '__start__', to: 'pauser' },
          { from: 'pauser', to: '__end__' },
          { from: 'dynamic', to: '__end__' },
        ],
        checkpointStore: store,
      });

    const first = await collect(build().execute({}, { threadId: 'fd-1' }));
    expect(first.at(-1)?.type).toBe('workflow.suspended');
    expect(ran).toEqual(['dispatcher']);

    const resumed = await collect(build().resume('fd-1', new Directive({ resume: 'go' })));
    expect(resumed.at(-1)?.type).toBe('workflow.end');
    // WF-1(a): the Dispatch survived the suspension.
    expect(ran).toEqual(['dispatcher', 'dynamic']);
  });
});

describe('WF-2 — two sequential pause() calls in ONE node body', () => {
  it('completes over two resumes with correct value delivery', async () => {
    const store = new InMemoryCheckpointStore();
    const build = () =>
      createWorkflow<S>({
        name: 'double-pause',
        channels: { decision: latestValue<string>(), second: latestValue<string>() },
        nodes: {
          gate: createNode<S>({
            name: 'gate',
            run: () => {
              const first = pause<string, string>('first-gate');
              const second = pause<string, string>('second-gate');
              return { decision: first, second };
            },
          }),
        },
        edges: [
          { from: '__start__', to: 'gate' },
          { from: 'gate', to: '__end__' },
        ],
        checkpointStore: store,
      });

    const run1 = await collect(build().execute({}, { threadId: 'dp-1' }));
    expect(run1.at(-1)?.type).toBe('workflow.suspended');

    const run2 = await collect(build().resume('dp-1', new Directive({ resume: 'alpha' })));
    // The first resume satisfies pause #1; the node pauses again at #2.
    expect(run2.at(-1)?.type).toBe('workflow.suspended');

    const run3 = await collect(build().resume('dp-1', new Directive({ resume: 'beta' })));
    const end = run3.at(-1);
    expect(end?.type).toBe('workflow.end');
    if (end?.type === 'workflow.end') {
      // WF-2: value #1 reaches pause #1, value #2 reaches pause #2 — the
      // old single-slot scope delivered 'beta' to pause #1 forever.
      expect(end.state.decision).toBe('alpha');
      expect(end.state.second).toBe('beta');
    }
  });
});

describe('WF-3 — crash recovery + aborted status', () => {
  it("a thread whose last checkpoint is 'running' (simulated crash) resumes from it", async () => {
    const ran: string[] = [];
    const store = new InMemoryCheckpointStore();
    const build = (crashOnB: boolean) =>
      createWorkflow<S>({
        name: 'crashy',
        channels: { a: latestValue<string>(), b: latestValue<string>() },
        nodes: {
          stepA: createNode<S>({
            name: 'stepA',
            run: () => {
              ran.push('A');
              return { a: 'A-done' };
            },
          }),
          stepB: createNode<S>({
            name: 'stepB',
            run: () => {
              ran.push('B');
              if (crashOnB) throw Object.assign(new Error('SIMULATED-KILL'), { simulated: true });
              return { b: 'B-done' };
            },
          }),
        },
        edges: [
          { from: '__start__', to: 'stepA' },
          { from: 'stepA', to: 'stepB' },
          { from: 'stepB', to: '__end__' },
        ],
        checkpointStore: store,
      });

    // Simulate a crash AFTER step A's 'running' checkpoint: consume the
    // stream only until step A completed, then abandon the iterator.
    const it1 = build(false).execute({}, { threadId: 'cr-1' })[Symbol.asyncIterator]();
    for (;;) {
      const n = await it1.next();
      if (n.done) break;
      if (n.value.type === 'workflow.step.end' && ran.includes('A')) break;
    }
    // The iterator is abandoned mid-run — the latest checkpoint is 'running'.
    await it1.return?.(undefined as never);

    const resumed = await collect(build(false).resume('cr-1'));
    const end = resumed.at(-1);
    expect(end?.type).toBe('workflow.end');
    // Step A is not re-run; step B runs (exactly once over the lifetime).
    expect(ran.filter((r) => r === 'B')).toHaveLength(1);
  });

  it('retry(threadId) re-runs ONLY the failed node; surviving siblings replay from pendingWrites', async () => {
    const ran: string[] = [];
    const store = new InMemoryCheckpointStore();
    let failOnce = true;
    const build = () =>
      createWorkflow<S>({
        name: 'retryable',
        channels: { a: latestValue<string>(), b: latestValue<string>() },
        nodes: {
          good: createNode<S>({
            name: 'good',
            run: () => {
              ran.push('good');
              return { a: 'good-output' };
            },
          }),
          flaky: createNode<S>({
            name: 'flaky',
            run: () => {
              ran.push('flaky');
              if (failOnce) {
                failOnce = false;
                throw new Error('transient');
              }
              return { b: 'flaky-output' };
            },
          }),
        },
        edges: [
          { from: '__start__', to: 'good' },
          { from: '__start__', to: 'flaky' },
          { from: 'good', to: '__end__' },
          { from: 'flaky', to: '__end__' },
        ],
        checkpointStore: store,
      });

    const first = await collect(build().execute({}, { threadId: 'rt-1' }));
    expect(first.some((e) => e.type === 'workflow.error')).toBe(true);
    expect(ran).toEqual(expect.arrayContaining(['good', 'flaky']));
    const goodRuns = ran.filter((r) => r === 'good').length;

    const wf2 = build() as unknown as {
      retry(threadId: string): AsyncIterable<{ type: string; state?: S }>;
    };
    const retried = await collect(wf2.retry('rt-1'));
    const end = retried.at(-1);
    expect(end?.type).toBe('workflow.end');
    // WF-3/WF-6: the successful sibling did NOT re-run — its persisted
    // pendingWrites were replayed instead.
    expect(ran.filter((r) => r === 'good').length).toBe(goodRuns);
    expect(ran.filter((r) => r === 'flaky').length).toBe(2);
    if (end?.type === 'workflow.end' && end.state !== undefined) {
      expect(end.state.a).toBe('good-output');
      expect(end.state.b).toBe('flaky-output');
    }
  });

  it("an abort at the step boundary persists status 'aborted', not 'running'", async () => {
    const store = new InMemoryCheckpointStore();
    const ctl = new AbortController();
    const wf = createWorkflow<S>({
      name: 'abortable',
      channels: { a: latestValue<string>() },
      nodes: {
        one: createNode<S>({
          name: 'one',
          run: () => {
            ctl.abort();
            return { a: 'one' };
          },
        }),
        two: createNode<S>({ name: 'two', run: () => ({ a: 'two' }) }),
      },
      edges: [
        { from: '__start__', to: 'one' },
        { from: 'one', to: 'two' },
        { from: 'two', to: '__end__' },
      ],
      checkpointStore: store,
    });
    await collect(wf.execute({}, { threadId: 'ab-1', signal: ctl.signal }));
    const tuple = await store.getTuple('ab-1', 'workflow/abortable');
    expect(tuple?.metadata.status).toBe('aborted');
  });
});

describe('WF-12 — double-resume of one suspended thread', () => {
  it('exactly one of two racing resumes wins; the loser gets checkpoint-version-conflict', async () => {
    const store = new InMemoryCheckpointStore();
    const build = () =>
      createWorkflow<S>({
        name: 'race',
        channels: { decision: latestValue<string>(), a: latestValue<string>() },
        nodes: {
          gate: createNode<S>({
            name: 'gate',
            run: () => ({ decision: pause<string, string>('gate') }),
          }),
          slow: createNode<S>({
            name: 'slow',
            run: async () => {
              await new Promise((r) => setTimeout(r, 30));
              return { a: 'slow-done' };
            },
          }),
        },
        edges: [
          { from: '__start__', to: 'gate' },
          { from: 'gate', to: 'slow' },
          { from: 'slow', to: '__end__' },
        ],
        checkpointStore: store,
      });

    await collect(build().execute({}, { threadId: 'race-1' }));
    // Two INDEPENDENT workflow instances (separate module state cannot be
    // simulated in-process, so this exercises the store-level guard).
    const [r1, r2] = await Promise.all([
      collect(build().resume('race-1', new Directive({ resume: 'A' }))),
      collect(build().resume('race-1', new Directive({ resume: 'B' }))),
    ]);
    const ended = [r1, r2].filter((evs) => evs.at(-1)?.type === 'workflow.end').length;
    const conflicted = [r1, r2].filter((evs) =>
      evs.some(
        (e) =>
          e.type === 'workflow.error' &&
          (e as { error?: { code?: string } }).error?.code === 'checkpoint-version-conflict',
      ),
    ).length;
    expect(ended).toBe(1);
    expect(conflicted).toBe(1);
  });
});

describe('WF-12 — concurrent execute() on one threadId', () => {
  it('exactly one of two racing executes completes; the loser gets checkpoint-version-conflict', async () => {
    const store = new InMemoryCheckpointStore();
    const build = () =>
      createWorkflow<S>({
        name: 'dup-exec',
        channels: { a: latestValue<string>() },
        nodes: {
          slow: createNode<S>({
            name: 'slow',
            run: async () => {
              await new Promise((r) => setTimeout(r, 30));
              return { a: 'done' };
            },
          }),
        },
        edges: [
          { from: '__start__', to: 'slow' },
          { from: 'slow', to: '__end__' },
        ],
        checkpointStore: store,
      });

    const [r1, r2] = await Promise.all([
      collect(build().execute({}, { threadId: 'dup-1' })),
      collect(build().execute({}, { threadId: 'dup-1' })),
    ]);
    const ended = [r1, r2].filter((evs) => evs.at(-1)?.type === 'workflow.end').length;
    const conflicted = [r1, r2].filter((evs) =>
      evs.some(
        (e) =>
          e.type === 'workflow.error' &&
          (e as { error?: { code?: string } }).error?.code === 'checkpoint-version-conflict',
      ),
    ).length;
    expect(ended).toBe(1);
    expect(conflicted).toBe(1);
  });
});

describe('WF-9 — ctx.state is a real frozen snapshot', () => {
  it('a node mutating ctx.state cannot corrupt siblings or the checkpoint', async () => {
    const store = new InMemoryCheckpointStore();
    const seen: Array<string[] | undefined> = [];
    const wf = createWorkflow<{ log: string[] }>({
      name: 'mutator',
      channels: { log: latestValue<string[]>({ default: ['initial'] }) },
      nodes: {
        evil: createNode<{ log: string[] }>({
          name: 'evil',
          run: (state) => {
            expect(() => {
              (state.log as string[]).push('MUTATED');
            }).toThrow();
            return {};
          },
        }),
        observer: createNode<{ log: string[] }>({
          name: 'observer',
          run: (state) => {
            seen.push([...state.log]);
            return {};
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'evil' },
        { from: '__start__', to: 'observer' },
        { from: 'evil', to: '__end__' },
        { from: 'observer', to: '__end__' },
      ],
      checkpointStore: store,
    });
    const events = await collect(wf.execute({}, { threadId: 'mu-1' }));
    expect(events.at(-1)?.type).toBe('workflow.end');
    expect(seen[0]).toEqual(['initial']);
  });
});

describe('WF-14 — dead ends are errors, not silent completions', () => {
  it('an all-false conditional fan reports a dead end instead of completing', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<S>({
      name: 'dead-end',
      channels: { a: latestValue<string>() },
      nodes: {
        chooser: createNode<S>({ name: 'chooser', run: () => ({ a: 'none-match' }) }),
        left: createNode<S>({ name: 'left', run: () => ({}) }),
        right: createNode<S>({ name: 'right', run: () => ({}) }),
      },
      edges: [
        { from: '__start__', to: 'chooser' },
        { from: 'chooser', to: 'left', when: (s) => s.a === 'left' },
        { from: 'chooser', to: 'right', when: (s) => s.a === 'right' },
        { from: 'left', to: '__end__' },
        { from: 'right', to: '__end__' },
      ],
      checkpointStore: store,
    });
    const events = await collect(wf.execute({}, { threadId: 'de-1' }));
    expect(events.at(-1)?.type).not.toBe('workflow.end');
    expect(
      events.some(
        (e) =>
          e.type === 'workflow.error' &&
          (e as { error?: { code?: string } }).error?.code === 'dead-end',
      ),
    ).toBe(true);
  });
});
