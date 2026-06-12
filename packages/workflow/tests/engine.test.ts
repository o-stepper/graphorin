import { collect, type WorkflowEvent } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import {
  createNode,
  createWorkflow,
  Directive,
  InMemoryCheckpointStore,
  latestValue,
  listAggregate,
  reducer,
  stream,
} from '../src/index.js';
import {
  buildOrderProcessingWorkflow,
  type OrderInput,
  type OrderState,
} from './fixtures/order-processing.js';

function eventTypes<T>(events: ReadonlyArray<WorkflowEvent<T>>): string[] {
  return events.map((e) => e.type);
}

describe('createWorkflow — execute() reference flow', () => {
  it('runs validate -> autoApprove -> ship to completion for low-value orders', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({ checkpointStore });
    const events: WorkflowEvent<OrderState & { amount?: number }>[] = [];
    for await (const event of wf.execute({ amount: 25 } satisfies OrderInput, {
      threadId: 'order-low-1',
    })) {
      events.push(event);
    }

    const types = eventTypes(events);
    expect(types[0]).toBe('workflow.start');
    expect(types[types.length - 1]).toBe('workflow.end');
    expect(types).toContain('workflow.step.start');
    expect(types).toContain('workflow.step.end');

    const final = events[events.length - 1];
    expect(final?.type).toBe('workflow.end');
    if (final?.type === 'workflow.end') {
      expect(final.state.status).toBe('shipped');
      expect(final.state.notes).toEqual(
        expect.arrayContaining(['validated amount=25', 'auto-approved', 'shipped']),
      );
    }
  });

  it('routes high-value orders through pause + resume', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({ checkpointStore });
    const events: WorkflowEvent<OrderState & { amount?: number }>[] = [];
    for await (const event of wf.execute({ amount: 1_500 } satisfies OrderInput, {
      threadId: 'order-high-1',
    })) {
      events.push(event);
    }

    const types = eventTypes(events);
    expect(types).toContain('workflow.suspended');
    const suspended = events.find((e) => e.type === 'workflow.suspended');
    expect(suspended).toBeDefined();
    if (suspended?.type === 'workflow.suspended') {
      expect(suspended.value).toMatchObject({ kind: 'approval', amount: 1_500 });
    }

    const resumeStream = wf.resume('order-high-1', new Directive({ resume: 'approved' }));
    const resumed: WorkflowEvent<OrderState & { amount?: number }>[] = [];
    for await (const event of resumeStream) {
      resumed.push(event);
    }
    const resumedTypes = eventTypes(resumed);
    expect(resumedTypes[0]).toBe('workflow.resumed');
    expect(resumedTypes[resumedTypes.length - 1]).toBe('workflow.end');
    const final = resumed[resumed.length - 1];
    if (final?.type === 'workflow.end') {
      expect(final.state.status).toBe('shipped');
      expect(final.state.decision).toBe('approved');
    }
  });

  it('honours rejection when the operator denies the approval', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({ checkpointStore });
    await collect(wf.execute({ amount: 1_500 }, { threadId: 'order-deny-1' }));
    const events = await collect(wf.resume('order-deny-1', new Directive({ resume: 'rejected' })));
    const final = events[events.length - 1];
    expect(final?.type).toBe('workflow.end');
    if (final?.type === 'workflow.end') {
      expect(final.state.status).toBe('rejected');
      expect(final.state.decision).toBe('rejected');
    }
  });
});

describe('Workflow.getState / listCheckpoints', () => {
  it('exposes the suspended snapshot via getState', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({ checkpointStore });
    await collect(wf.execute({ amount: 9_999 }, { threadId: 'order-state-1' }));
    const snapshot = await wf.getState('order-state-1');
    expect(snapshot.status).toBe('suspended');
    expect(snapshot.pendingPause).toBeDefined();
    expect(snapshot.pendingPause?.nodeName).toBe('requestApproval');
  });

  it('lists every checkpoint persisted across the run', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({ checkpointStore });
    await collect(wf.execute({ amount: 25 }, { threadId: 'order-list-1' }));
    const checkpoints = await wf.listCheckpoints('order-list-1');
    expect(checkpoints.length).toBeGreaterThan(0);
    const stepNumbers = checkpoints.map((c) => c.stepNumber);
    expect(new Set(stepNumbers).size).toBe(stepNumbers.length);
  });
});

describe('Workflow.fork', () => {
  it('clones a thread without disturbing the original', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({ checkpointStore });
    await collect(wf.execute({ amount: 25 }, { threadId: 'thread-original' }));
    const checkpoints = await wf.listCheckpoints('thread-original');
    const middle = checkpoints[Math.floor(checkpoints.length / 2)];
    if (!middle) throw new Error('expected a middle checkpoint');
    const { newThreadId } = await wf.fork('thread-original', middle.id);
    expect(newThreadId).not.toBe('thread-original');
    const cloned = await wf.getState(newThreadId);
    expect(cloned.threadId).toBe(newThreadId);
    const original = await wf.getState('thread-original');
    expect(original.threadId).toBe('thread-original');
  });

  it('rejects fork from a missing checkpoint', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({ checkpointStore });
    await collect(wf.execute({ amount: 25 }, { threadId: 'thread-missing-cp' }));
    await expect(wf.fork('thread-missing-cp', 'cp-does-not-exist')).rejects.toMatchObject({
      code: 'checkpoint-not-found',
    });
  });
});

describe('Dispatch — dynamic parallelism', () => {
  it('schedules per-item children inside the workflow timeline', async () => {
    interface DState {
      result: ReadonlyArray<string>;
    }
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = createWorkflow<DState, Partial<DState>>({
      name: 'dispatch-test',
      channels: {
        result: listAggregate<string>({ default: [] }) as never,
      },
      nodes: {
        fanOut: createNode<DState>({
          name: 'fanOut',
          run: () => [
            { nodeName: 'process', args: { id: 'a' } },
            { nodeName: 'process', args: { id: 'b' } },
            { nodeName: 'process', args: { id: 'c' } },
          ],
        }),
        process: createNode<DState>({
          name: 'process',
          run: async (_state, ctx) => {
            const id = (ctx.dispatchArgs as { id: string }).id;
            return { result: [`processed-${id}`] };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'fanOut' },
        { from: 'process', to: '__end__' },
      ],
      checkpointStore,
    });
    const events = await collect(wf.execute({}, { threadId: 'dispatch-1' }));
    const final = events[events.length - 1];
    expect(final?.type).toBe('workflow.end');
    if (final?.type === 'workflow.end') {
      expect([...(final.state as DState).result].sort()).toEqual([
        'processed-a',
        'processed-b',
        'processed-c',
      ]);
    }
  });
});

describe('Stream modes', () => {
  it('emits only state.start / step.end pairs for `values`', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({ checkpointStore });
    const events = await collect(
      wf.execute({ amount: 25 }, { threadId: 'mode-values', stream: 'values' }),
    );
    const types = new Set(eventTypes(events));
    expect(types.has('workflow.step.start')).toBe(true);
    expect(types.has('workflow.step.end')).toBe(true);
    expect(types.has('workflow.checkpoint.written')).toBe(false);
  });

  it('emits checkpoint events under `checkpoints`', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({ checkpointStore });
    const events = await collect(
      wf.execute({ amount: 25 }, { threadId: 'mode-checkpoints', stream: 'checkpoints' }),
    );
    expect(eventTypes(events)).toEqual(expect.arrayContaining(['workflow.checkpoint.written']));
  });

  it('emits channel.update events under `updates`', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({ checkpointStore });
    const events = await collect(
      wf.execute({ amount: 25 }, { threadId: 'mode-updates', stream: 'updates' }),
    );
    expect(eventTypes(events)).toEqual(expect.arrayContaining(['workflow.channel.update']));
  });

  it('surfaces ctx.emit() output via stream: custom', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'custom-events',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        emit: createNode<{ value: number }>({
          name: 'emit',
          run: (_state, ctx) => {
            ctx.emit('boot', { ready: true });
            return { value: 1 };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'emit' },
        { from: 'emit', to: '__end__' },
      ],
      checkpointStore,
    });
    const events = await collect(wf.execute({}, { threadId: 'custom-1', stream: 'custom' }));
    const custom = events.find((e) => e.type === 'workflow.custom');
    expect(custom).toBeDefined();
    if (custom?.type === 'workflow.custom') {
      expect(custom.name).toBe('boot');
      expect(custom.payload).toEqual({ ready: true });
    }
  });
});

describe('cancellation', () => {
  it('aborts the run when the supplied AbortSignal fires', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    let dispatchedTaskCount = 0;
    const wf = createWorkflow<{ ticks: number }>({
      name: 'cancel-test',
      channels: { ticks: reducer<number>((a, b) => a + b, { default: 0 }) },
      nodes: {
        loop: createNode<{ ticks: number }>({
          name: 'loop',
          run: async (_state, ctx) => {
            dispatchedTaskCount += 1;
            await new Promise<void>((resolve, reject) => {
              const timer = setTimeout(() => resolve(), 50);
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
      checkpointStore,
      cancelGraceMs: 0,
    });
    const ac = new AbortController();
    setTimeout(() => ac.abort('user-stop'), 80);
    const events: WorkflowEvent<{ ticks: number }>[] = [];
    for await (const event of wf.execute({}, { threadId: 'cancel-1', signal: ac.signal })) {
      events.push(event);
    }
    expect(eventTypes(events)).toContain('workflow.error');
    const error = events.find((e) => e.type === 'workflow.error');
    if (error?.type === 'workflow.error') {
      expect(error.error.code).toBe('workflow-aborted');
    }
    expect(dispatchedTaskCount).toBeGreaterThan(0);
  });
});

describe('static pauseAt', () => {
  it('suspends before listed nodes', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({
      checkpointStore,
      pauseAt: { before: ['ship'] },
    });
    const events = await collect(wf.execute({ amount: 25 }, { threadId: 'pause-before-1' }));
    const suspended = events.find((e) => e.type === 'workflow.suspended');
    expect(suspended).toBeDefined();
    if (suspended?.type === 'workflow.suspended') {
      expect(suspended.value).toMatchObject({ kind: 'static-before', node: 'ship' });
    }
    const resumed = await collect(
      wf.resume('pause-before-1', new Directive({ resume: undefined })),
    );
    const final = resumed[resumed.length - 1];
    expect(final?.type).toBe('workflow.end');
  });

  it('suspends after listed nodes', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = buildOrderProcessingWorkflow({
      checkpointStore,
      pauseAt: { after: ['validate'] },
    });
    const events = await collect(wf.execute({ amount: 25 }, { threadId: 'pause-after-1' }));
    const suspended = events.find((e) => e.type === 'workflow.suspended');
    expect(suspended).toBeDefined();
    if (suspended?.type === 'workflow.suspended') {
      expect(suspended.value).toMatchObject({ kind: 'static-after', node: 'validate' });
    }
    const resumed = await collect(wf.resume('pause-after-1', new Directive({ resume: undefined })));
    const final = resumed[resumed.length - 1];
    expect(final?.type).toBe('workflow.end');
  });
});

describe('Stream channel + concurrency', () => {
  it('merges parallel writes into a Stream channel deterministically', async () => {
    interface SState {
      events: ReadonlyArray<string>;
    }
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = createWorkflow<SState>({
      name: 'stream-merge',
      channels: { events: stream<string>({ default: [] }) as never },
      nodes: {
        seed: createNode<SState>({
          name: 'seed',
          run: () => [
            { nodeName: 'emitA', args: undefined },
            { nodeName: 'emitB', args: undefined },
          ],
        }),
        emitA: createNode<SState>({
          name: 'emitA',
          run: async () => ({ events: ['A'] }),
        }),
        emitB: createNode<SState>({
          name: 'emitB',
          run: async () => ({ events: ['B'] }),
        }),
      },
      edges: [
        { from: '__start__', to: 'seed' },
        { from: 'emitA', to: '__end__' },
        { from: 'emitB', to: '__end__' },
      ],
      checkpointStore,
    });
    const events = await collect(wf.execute({}, { threadId: 'stream-1' }));
    const final = events[events.length - 1];
    if (final?.type === 'workflow.end') {
      const stateEvents = (final.state as SState).events;
      expect([...stateEvents].sort()).toEqual(['A', 'B']);
    }
  });
});
