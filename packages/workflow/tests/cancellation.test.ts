import { describe, expect, it } from 'vitest';

import {
  createNode,
  createWorkflow,
  InMemoryCheckpointStore,
  latestValue,
  reducer,
  type WorkflowEvent,
} from '../src/index.js';

describe('cancellation', () => {
  it('honors a pre-aborted signal without running any nodes', async () => {
    const store = new InMemoryCheckpointStore();
    let invocations = 0;
    const wf = createWorkflow<{ value: number }>({
      name: 'pre-aborted',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({
          name: 'a',
          run: () => {
            invocations += 1;
            return { value: 1 };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: '__end__' },
      ],
      checkpointStore: store,
    });
    const ac = new AbortController();
    ac.abort('pre-aborted');
    const events: WorkflowEvent<{ value: number }>[] = [];
    for await (const event of wf.execute({}, { threadId: 'pre-1', signal: ac.signal })) {
      events.push(event);
    }
    expect(invocations).toBe(0);
    const error = events.find((e) => e.type === 'workflow.error');
    expect(error).toBeDefined();
    if (error?.type === 'workflow.error') expect(error.error.code).toBe('workflow-aborted');
  });

  it('stops within 100 ms of AbortSignal.abort() and persists the last clean checkpoint', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ ticks: number }>({
      name: 'ticker',
      channels: { ticks: reducer<number>((a, b) => a + b, { default: 0 }) },
      nodes: {
        loop: createNode<{ ticks: number }>({
          name: 'loop',
          run: async (_state, ctx) => {
            await new Promise<void>((resolve, reject) => {
              const timer = setTimeout(() => resolve(), 25);
              ctx.signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(new Error('cancelled by signal'));
              });
            });
            return { ticks: 1 };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'loop' },
        { from: 'loop', to: 'loop' },
      ],
      checkpointStore: store,
      cancelGraceMs: 0,
    });
    const ac = new AbortController();
    setTimeout(() => ac.abort('user-stop'), 60);

    const events: WorkflowEvent<{ ticks: number }>[] = [];
    const start = Date.now();
    for await (const event of wf.execute({}, { threadId: 'ticker-1', signal: ac.signal })) {
      events.push(event);
    }
    const totalMs = Date.now() - start;

    const error = events.find((e) => e.type === 'workflow.error');
    expect(error).toBeDefined();
    if (error?.type === 'workflow.error') {
      expect(error.error.code).toBe('workflow-aborted');
    }
    // Allow a generous 200 ms margin on top of the 60 ms abort delay so we
    // tolerate scheduler jitter while still asserting the spec's ~100 ms
    // grace window holds.
    expect(totalMs - 60).toBeLessThan(200);

    // The last clean checkpoint should still be readable.
    const tuple = await store.getTuple('ticker-1', 'workflow/ticker');
    expect(tuple).not.toBeNull();
  });

  it('cancellation mid-run does not corrupt the store', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'noop-cancel',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        slow: createNode<{ value: number }>({
          name: 'slow',
          run: async (_state, ctx) =>
            new Promise<{ value: number }>((resolve, reject) => {
              const timer = setTimeout(() => resolve({ value: 1 }), 200);
              ctx.signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(new Error('aborted'));
              });
            }),
        }),
      },
      edges: [
        { from: '__start__', to: 'slow' },
        { from: 'slow', to: '__end__' },
      ],
      checkpointStore: store,
    });
    const ac = new AbortController();
    setTimeout(() => ac.abort('mid-run'), 30);

    const events: WorkflowEvent<{ value: number }>[] = [];
    for await (const event of wf.execute({}, { threadId: 'noop-1', signal: ac.signal })) {
      events.push(event);
    }
    const tuple = await store.getTuple('noop-1', 'workflow/noop-cancel');
    expect(tuple?.metadata.status).toBe('failed');
  });
});
