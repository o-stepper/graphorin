/**
 * W-032 - the durable-timer polling driver: the engine stamps
 * `metadata.wakeAt` on timer suspends, `listSuspended` enumerates due
 * threads, and `createTimerDriver` ticks them - so a `sleepUntil`
 * thread completes with zero user polling code.
 */
import { describe, expect, it } from 'vitest';
import {
  createNode,
  createTimerDriver,
  createWorkflow,
  InMemoryCheckpointStore,
  latestValue,
  namespaceFor,
  sleepUntil,
  TimerDriverStoreUnsupportedError,
} from '../src/index.js';


const WAKE_AT = Date.parse('2030-01-01T00:00:00.000Z');

async function drain<T>(events: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const ev of events) out.push(ev);
  return out;
}

interface TimerState {
  fired: boolean;
}

function timerWorkflow(store: InMemoryCheckpointStore, name = 'timers') {
  return createWorkflow<TimerState>({
    name,
    channels: { fired: latestValue<boolean>() as never },
    nodes: {
      waiter: createNode<TimerState>({
        name: 'waiter',
        run: () => {
          sleepUntil(WAKE_AT);
          return { fired: true };
        },
      }),
    },
    edges: [
      { from: '__start__', to: 'waiter' },
      { from: 'waiter', to: '__end__' },
    ],
    checkpointStore: store,
  });
}

describe('W-032 - wakeAt stamping and listSuspended', () => {
  it('a timer suspend stamps metadata.wakeAt; listSuspended enumerates it when due', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = timerWorkflow(store);
    await drain(wf.execute({} as never, { threadId: 'timer-1' }));
    const ns = namespaceFor({ name: 'timers' });

    const tuple = await store.getTuple('timer-1', ns);
    expect(tuple?.metadata.status).toBe('suspended');
    expect(tuple?.metadata.wakeAt).toBe(WAKE_AT);

    // Not due yet.
    expect(await store.listSuspended(ns, { dueBefore: WAKE_AT - 1 })).toEqual([]);
    // Due.
    expect(await store.listSuspended(ns, { dueBefore: WAKE_AT + 1 })).toEqual([
      { threadId: 'timer-1', wakeAt: WAKE_AT },
    ]);
  });

  it('a non-timer suspend (awakeable) does not stamp wakeAt', async () => {
    const store = new InMemoryCheckpointStore();
    const { awaitExternal } = await import('../src/index.js');
    const wf = createWorkflow<TimerState>({
      name: 'awakeable-only',
      channels: { fired: latestValue<boolean>() as never },
      nodes: {
        waiter: createNode<TimerState>({
          name: 'waiter',
          run: () => {
            awaitExternal('go');
            return { fired: true };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'waiter' },
        { from: 'waiter', to: '__end__' },
      ],
      checkpointStore: store,
    });
    await drain(wf.execute({} as never, { threadId: 'a-1' }));
    const tuple = await store.getTuple('a-1', namespaceFor({ name: 'awakeable-only' }));
    expect(tuple?.metadata.status).toBe('suspended');
    expect(tuple?.metadata.wakeAt).toBeUndefined();
    expect(await store.listSuspended(namespaceFor({ name: 'awakeable-only' }))).toEqual([]);
  });
});

describe('W-032 - createTimerDriver', () => {
  it('a sleeping thread completes through the driver with no manual tick', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = timerWorkflow(store);
    await drain(wf.execute({} as never, { threadId: 'timer-e2e' }));

    const driver = createTimerDriver({
      workflows: [{ workflow: wf, checkpointStore: store }],
      now: () => WAKE_AT + 1,
    });
    const fired = await driver.sweep();
    expect(fired).toBe(1);

    const state = await wf.getState('timer-e2e');
    expect(state.status).toBe('completed');
    expect((state.state as TimerState).fired).toBe(true);
    expect(driver.status().fired).toBe(1);
    expect(driver.status().errors).toBe(0);
  });

  it('a pre-deadline sweep fires nothing and reports the next wake', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = timerWorkflow(store);
    await drain(wf.execute({} as never, { threadId: 'timer-early' }));
    const driver = createTimerDriver({
      workflows: [{ workflow: wf, checkpointStore: store }],
      now: () => WAKE_AT - 60_000,
    });
    expect(await driver.sweep()).toBe(0);
    const state = await wf.getState('timer-early');
    expect(state.status).toBe('suspended');
  });

  it('per-thread tick errors are isolated - the sweep continues and reports them', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = timerWorkflow(store);
    await drain(wf.execute({} as never, { threadId: 'ok-1' }));

    const failures: Array<{ workflow: string; threadId: string }> = [];
    const explodingWorkflow = {
      name: 'timers',
      tick: async (threadId: string) => {
        if (threadId === 'ok-1') {
          return wf.tick(threadId, { now: WAKE_AT + 1 });
        }
        throw new Error('tick exploded');
      },
    };
    // Seed a second due thread by running another instance.
    await drain(wf.execute({} as never, { threadId: 'boom-1' }));

    const driver = createTimerDriver({
      workflows: [{ workflow: explodingWorkflow, checkpointStore: store }],
      now: () => WAKE_AT + 1,
      onError: (workflow, threadId) => failures.push({ workflow, threadId }),
    });
    const fired = await driver.sweep();
    expect(fired).toBe(1);
    expect(failures).toEqual([{ workflow: 'timers', threadId: 'boom-1' }]);
    expect(driver.status().errors).toBe(1);
  });

  it('start() sweeps immediately and re-arms; stop() cancels the pending pass', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = timerWorkflow(store);
    await drain(wf.execute({} as never, { threadId: 'timer-arm' }));

    const scheduled: Array<{ fn: () => void; ms: number }> = [];
    let cleared = 0;
    const driver = createTimerDriver({
      workflows: [{ workflow: wf, checkpointStore: store }],
      now: () => WAKE_AT + 1,
      pollIntervalMs: 30_000,
      setTimeoutImpl: (fn, ms) => {
        scheduled.push({ fn, ms });
        return scheduled.length;
      },
      clearTimeoutImpl: () => {
        cleared += 1;
      },
    });
    driver.start();
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]?.ms).toBe(0);
    // Fire the immediate pass; when it settles the driver re-arms.
    scheduled[0]?.fn();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(driver.status().fired).toBe(1);
    expect(scheduled.length).toBe(2);
    driver.stop();
    expect(cleared).toBeGreaterThan(0);
    expect(driver.status().running).toBe(false);
  });

  it('a store without listSuspended throws the typed error at construction', () => {
    const store = new InMemoryCheckpointStore();
    const wf = timerWorkflow(store);
    const bareStore = {
      put: store.put.bind(store),
      putWrites: store.putWrites.bind(store),
      getTuple: store.getTuple.bind(store),
      list: store.list.bind(store),
      deleteThread: store.deleteThread.bind(store),
    };
    expect(() =>
      createTimerDriver({ workflows: [{ workflow: wf, checkpointStore: bareStore as never }] }),
    ).toThrow(TimerDriverStoreUnsupportedError);
  });

  it('the full event stream of a driver-resumed thread stays well-formed', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = timerWorkflow(store);
    const events = await drain(wf.execute({} as never, { threadId: 'timer-events' }));
    expect(events.at(-1)?.type).toBe('workflow.suspended');
    const driver = createTimerDriver({
      workflows: [{ workflow: wf, checkpointStore: store }],
      now: () => WAKE_AT + 1,
    });
    await driver.sweep();
    expect((await wf.getState('timer-events')).status).toBe('completed');
  });
});
