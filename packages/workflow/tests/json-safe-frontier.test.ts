/**
 * W-121 - the WF-10 JSON-safety gate covers EVERYTHING that rides the
 * checkpoint, not just channel state: pause values (approval payloads),
 * dispatchArgs, satisfied resume values, and operator directives. A
 * Date/Map/function can no longer silently degrade through the
 * frontier's JSON round-trip.
 */
import { describe, expect, it } from 'vitest';
import {
  awaitExternal,
  createNode,
  createWorkflow,
  Directive,
  Dispatch,
  InMemoryCheckpointStore,
  latestValue,
  requestApproval,
} from '../src/index.js';

async function drain<T>(events: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const ev of events) out.push(ev);
  return out;
}

interface S {
  got: string;
}

function awaitingWorkflow(store: InMemoryCheckpointStore, name = 'gate') {
  return createWorkflow<S>({
    name,
    channels: { got: latestValue<string>() as never },
    nodes: {
      waiter: createNode<S>({
        name: 'waiter',
        run: () => {
          const got = awaitExternal<string>('first');
          // A second wait so a resumed thread re-pauses and the
          // delivered directive value has to round-trip the frontier.
          const more = awaitExternal<string>('second');
          return { got: `${got}/${more}` };
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

describe('W-121 - directives are validated at resume entry', () => {
  it('a Date resume value fails IMMEDIATELY with state-not-serializable at <directive>.resume', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = awaitingWorkflow(store);
    await drain(wf.execute({} as never, { threadId: 't-date' }));

    const events = await drain(
      wf.resume('t-date', new Directive({ resume: new Date('2030-01-01') })),
    );
    const last = events.at(-1);
    expect(last?.type).toBe('workflow.error');
    if (last?.type === 'workflow.error') {
      expect(last.error.code).toBe('state-not-serializable');
      expect(last.error.message).toContain('<directive>');
      expect(last.error.message).toContain('Date');
    }
    // The thread is untouched - still suspended on the first pause.
    expect((await wf.getState('t-date')).status).toBe('suspended');
  });

  it('a Map inside directive.update fails the same way', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = awaitingWorkflow(store, 'gate-update');
    await drain(wf.execute({} as never, { threadId: 't-map' }));
    const events = await drain(
      wf.resume('t-map', new Directive({ resume: 'ok', update: { got: new Map() } as never })),
    );
    const last = events.at(-1);
    expect(last?.type).toBe('workflow.error');
    if (last?.type === 'workflow.error') {
      expect(last.error.code).toBe('state-not-serializable');
      expect(last.error.message).toContain('<directive>');
    }
  });

  it('clean JSON directives pass and the thread completes as before', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = awaitingWorkflow(store, 'gate-clean');
    await drain(wf.execute({} as never, { threadId: 't-ok' }));
    await drain(wf.resume('t-ok', new Directive({ resume: 'A' })));
    await drain(wf.resume('t-ok', new Directive({ resume: 'B' })));
    const state = await wf.getState('t-ok');
    expect(state.status).toBe('completed');
    expect((state.state as S).got).toBe('A/B');
  });
});

describe('W-121 - frontier payloads are validated at persist', () => {
  it('an approval payload with a function fails with the <pause:...> pseudo-channel', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<S>({
      name: 'gate-payload',
      channels: { got: latestValue<string>() as never },
      nodes: {
        approver: createNode<S>({
          name: 'approver',
          run: () => {
            const d = requestApproval<{ ok: boolean }>('deploy', {
              env: 'prod',
              callback: () => 'nope',
            } as never);
            return { got: String(d.ok) };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'approver' },
        { from: 'approver', to: '__end__' },
      ],
      checkpointStore: store,
    });
    const events = await drain(wf.execute({} as never, { threadId: 't-fn' }));
    const last = events.at(-1);
    expect(last?.type).toBe('workflow.error');
    if (last?.type === 'workflow.error') {
      expect(last.error.code).toBe('state-not-serializable');
      expect(last.error.message).toContain('<pause:approver>');
      expect(last.error.message).toContain('function');
    }
  });

  it('a Dispatch whose args hold a Map fails at persist with a typed error', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<S>({
      name: 'gate-dispatch',
      channels: { got: latestValue<string>() as never },
      nodes: {
        planner: createNode<S>({
          name: 'planner',
          run: () => new Dispatch('waiter', { lookup: new Map([['a', 1]]) }) as never,
        }),
        waiter: createNode<S>({
          name: 'waiter',
          run: () => {
            awaitExternal<string>('go');
            return { got: 'done' };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'planner' },
        { from: 'waiter', to: '__end__' },
      ],
      checkpointStore: store,
    });
    const events = await drain(wf.execute({} as never, { threadId: 't-dispatch' }));
    const last = events.at(-1);
    expect(last?.type).toBe('workflow.error');
    if (last?.type === 'workflow.error') {
      expect(last.error.code).toBe('state-not-serializable');
      expect(last.error.message).toContain('Map');
    }
  });
});
