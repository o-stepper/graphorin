/**
 * W-122 - `maxSteps` caps steps PER INVOCATION (the documented
 * infinite-loop safeguard), not per thread lifetime: a durable thread
 * cycling through pauses survives past the cap, a capped-out
 * invocation is retryable, and the opt-in `maxTotalSteps` restores a
 * lifetime quota for those who want one.
 */
import { describe, expect, it } from 'vitest';
import {
  awaitExternal,
  createNode,
  createWorkflow,
  Directive,
  InMemoryCheckpointStore,
  latestValue,
  sleepUntil,
} from '../src/index.js';

async function drain<T>(events: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const ev of events) out.push(ev);
  return out;
}

interface CounterState {
  count: number;
  done: boolean;
}

/** Node that loops via an edge cycle until `count` reaches `target`. */
function loopingWorkflow(
  store: InMemoryCheckpointStore,
  args: { readonly target: number; readonly maxSteps?: number; readonly maxTotalSteps?: number },
) {
  return createWorkflow<CounterState>({
    name: 'looper',
    channels: {
      count: latestValue<number>({ default: 0 }) as never,
      done: latestValue<boolean>({ default: false }) as never,
    },
    nodes: {
      bump: createNode<CounterState>({
        name: 'bump',
        run: (state) => ({ count: state.count + 1, done: state.count + 1 >= args.target }),
      }),
    },
    edges: [
      { from: '__start__', to: 'bump' },
      { from: 'bump', to: 'bump', when: (s) => !s.done },
      { from: 'bump', to: '__end__', when: (s) => s.done },
    ],
    checkpointStore: store,
    ...(args.maxSteps !== undefined ? { maxSteps: args.maxSteps } : {}),
    ...(args.maxTotalSteps !== undefined ? { maxTotalSteps: args.maxTotalSteps } : {}),
  });
}

describe('W-122 - maxSteps is per invocation', () => {
  it('a durable thread survives more cumulative steps than maxSteps across resume cycles', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<CounterState>({
      name: 'pauser',
      channels: {
        count: latestValue<number>({ default: 0 }) as never,
        done: latestValue<boolean>({ default: false }) as never,
      },
      nodes: {
        wait: createNode<CounterState>({
          name: 'wait',
          run: (state) => {
            awaitExternal<string>('go');
            return { count: state.count + 1, done: state.count + 1 >= 5 };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'wait' },
        { from: 'wait', to: 'wait', when: (s) => !s.done },
        { from: 'wait', to: '__end__', when: (s) => s.done },
      ],
      checkpointStore: store,
      maxSteps: 3,
    });
    await drain(wf.execute({} as never, { threadId: 't-cycles' }));
    // Five resume cycles - cumulative steps far past maxSteps: 3.
    for (let i = 0; i < 5; i += 1) {
      const events = await drain(wf.resolveAwakeable('t-cycles', 'go', `v${i}`));
      expect(events.some((e) => e.type === 'workflow.error')).toBe(false);
    }
    const state = await wf.getState('t-cycles');
    expect(state.status).toBe('completed');
  });

  it('an edge cycle inside ONE invocation still trips max-steps-exceeded at the cap', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = loopingWorkflow(store, { target: 100, maxSteps: 5 });
    const events = await drain(wf.execute({} as never, { threadId: 't-loop' }));
    const last = events.at(-1);
    expect(last?.type).toBe('workflow.error');
    if (last?.type === 'workflow.error') {
      expect(last.error.code).toBe('max-steps-exceeded');
      expect(last.error.message).toContain('one invocation');
    }
  });

  it('retry after a cap failure starts a FRESH invocation counter and can finish', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = loopingWorkflow(store, { target: 8, maxSteps: 5 });
    const first = await drain(wf.execute({} as never, { threadId: 't-retry' }));
    expect(first.at(-1)?.type).toBe('workflow.error');
    // Pre-W-122 this re-failed immediately: the restored cumulative
    // stepNumber was already past the cap. Now the retry continues from
    // the checkpointed count and completes within its own budget.
    const retried = await drain(wf.retry('t-retry'));
    expect(retried.some((e) => e.type === 'workflow.error')).toBe(false);
    const state = await wf.getState('t-retry');
    expect(state.status).toBe('completed');
    expect((state.state as CounterState).count).toBe(8);
  });

  it('maxTotalSteps restores the lifetime quota on the cumulative number', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = loopingWorkflow(store, { target: 100, maxSteps: 5, maxTotalSteps: 8 });
    await drain(wf.execute({} as never, { threadId: 't-total' }));
    const retried = await drain(wf.retry('t-total'));
    const last = retried.at(-1);
    expect(last?.type).toBe('workflow.error');
    if (last?.type === 'workflow.error') {
      expect(last.error.code).toBe('max-steps-exceeded');
      expect(last.error.message).toContain('maxTotalSteps');
    }
  });

  it('a tick invocation gets its own budget too', async () => {
    const WAKE = Date.parse('2030-01-01T00:00:00.000Z');
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<CounterState>({
      name: 'tick-budget',
      channels: {
        count: latestValue<number>({ default: 0 }) as never,
        done: latestValue<boolean>({ default: false }) as never,
      },
      nodes: {
        sleeper: createNode<CounterState>({
          name: 'sleeper',
          run: (state) => {
            sleepUntil(WAKE);
            return { count: state.count + 1, done: true };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'sleeper' },
        { from: 'sleeper', to: '__end__' },
      ],
      checkpointStore: store,
      // Tight cap: the pre-W-122 lifetime semantics would refuse the
      // tick outright (resume seeds stepNumber past the cap).
      maxSteps: 2,
    });
    await drain(wf.execute({} as never, { threadId: 't-tick' }));
    const result = await wf.tick('t-tick', { now: WAKE + 1 });
    expect(result.fired).toBe(true);
    expect((await wf.getState('t-tick')).status).toBe('completed');
  });

  it('rejects a non-positive maxTotalSteps at build time', () => {
    const store = new InMemoryCheckpointStore();
    expect(() => loopingWorkflow(store, { target: 2, maxTotalSteps: 0 })).toThrow(
      /maxTotalSteps must be a positive integer/,
    );
  });

  it('resume also gets a fresh budget while honoring the per-invocation cap', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<CounterState>({
      name: 'resume-budget',
      channels: {
        count: latestValue<number>({ default: 0 }) as never,
        done: latestValue<boolean>({ default: false }) as never,
      },
      nodes: {
        gate: createNode<CounterState>({
          name: 'gate',
          run: (state) => {
            awaitExternal<string>('open');
            return { count: state.count + 1, done: false };
          },
        }),
        churn: createNode<CounterState>({
          name: 'churn',
          run: (state) => ({ count: state.count + 1, done: state.count + 1 >= 100 }),
        }),
      },
      edges: [
        { from: '__start__', to: 'gate' },
        { from: 'gate', to: 'churn' },
        { from: 'churn', to: 'churn', when: (s) => !s.done },
        { from: 'churn', to: '__end__', when: (s) => s.done },
      ],
      checkpointStore: store,
      maxSteps: 4,
    });
    await drain(wf.execute({} as never, { threadId: 't-resume-cap' }));
    // The resumed invocation churns past ITS OWN cap and fails there -
    // the safeguard is preserved, just scoped to the invocation.
    const events = await drain(wf.resume('t-resume-cap', new Directive({ resume: 'ok' })));
    const last = events.at(-1);
    expect(last?.type).toBe('workflow.error');
    if (last?.type === 'workflow.error') {
      expect(last.error.code).toBe('max-steps-exceeded');
    }
  });
});
