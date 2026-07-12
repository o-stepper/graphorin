import { awaitExternal, collect, type PayloadSchemaLike } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  createNode,
  createWorkflow,
  InMemoryCheckpointStore,
  latestValue,
  parseAwakeableRef,
  serializeAwakeableRef,
} from '../src/index.js';

/**
 * A3 (item 16 tail) - awakeable payload validation at the replay
 * delivery point. A hand-rolled structural schema proves the seam is
 * zod-agnostic (PayloadSchemaLike matches zod v3/v4 structurally).
 */
const AMOUNT_SCHEMA: PayloadSchemaLike<number> = {
  safeParse(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return { success: true as const, data: value };
    }
    return {
      success: false as const,
      error: { message: 'expected a positive finite number' },
    };
  },
};

interface PayState {
  status: 'pending' | 'paid';
  amount?: number;
}

function buildWorkflow(store: InMemoryCheckpointStore) {
  return createWorkflow<PayState>({
    name: 'awakeable-schema',
    channels: {
      status: latestValue<PayState['status']>({ default: 'pending' }),
      amount: latestValue<PayState['amount']>(),
    },
    nodes: {
      wait: createNode<PayState>({
        name: 'wait',
        run: async () => {
          const amount = awaitExternal<number>('payment', { schema: AMOUNT_SCHEMA });
          return { amount, status: 'paid' };
        },
      }),
    },
    edges: [
      { from: '__start__', to: 'wait' },
      { from: 'wait', to: '__end__' },
    ],
    checkpointStore: store,
  });
}

describe('awaitExternal({ schema }) - payload validation on delivery', () => {
  it('a valid payload passes the schema and the node receives the parsed value', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = buildWorkflow(store);
    await collect(wf.execute({}, { threadId: 't-valid' }));
    expect((await wf.getState('t-valid')).status).toBe('suspended');

    await collect(wf.resolveAwakeable('t-valid', 'payment', 42));
    const state = await wf.getState('t-valid');
    expect(state.status).toBe('completed');
    expect(state.state.amount).toBe(42);
  });

  it('an invalid payload restores the suspension and surfaces a typed error', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = buildWorkflow(store);
    await collect(wf.execute({}, { threadId: 't-invalid' }));

    const events = await collect(wf.resolveAwakeable('t-invalid', 'payment', 'not-a-number'));
    const error = events.find((e) => e.type === 'workflow.error');
    expect(error).toBeDefined();
    expect(error?.type === 'workflow.error' && error.error.code).toBe('awakeable-payload-invalid');

    // The thread is still suspended on the SAME awakeable.
    const state = await wf.getState('t-invalid');
    expect(state.status).toBe('suspended');
    expect(state.pendingPauses?.some((p) => p.name === 'payment')).toBe(true);
  });

  it('the rejected payload is discarded - a later valid resolve completes the thread', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = buildWorkflow(store);
    await collect(wf.execute({}, { threadId: 't-retry' }));

    await collect(wf.resolveAwakeable('t-retry', 'payment', -1));
    expect((await wf.getState('t-retry')).status).toBe('suspended');

    // If the invalid value had persisted as satisfied, this replay
    // would fail validation forever. It must complete instead.
    await collect(wf.resolveAwakeable('t-retry', 'payment', 7));
    const state = await wf.getState('t-retry');
    expect(state.status).toBe('completed');
    expect(state.state.amount).toBe(7);
  });

  it('previously satisfied values replay through validation on later resumes', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ total: number }>({
      name: 'awakeable-schema-two',
      channels: { total: latestValue<number>({ default: 0 }) },
      nodes: {
        wait: createNode<{ total: number }>({
          name: 'wait',
          run: async () => {
            const first = awaitExternal<number>('first', { schema: AMOUNT_SCHEMA });
            const second = awaitExternal<number>('second', { schema: AMOUNT_SCHEMA });
            return { total: first + second };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'wait' },
        { from: 'wait', to: '__end__' },
      ],
      checkpointStore: store,
    });
    await collect(wf.execute({}, { threadId: 't-two' }));
    await collect(wf.resolveAwakeable('t-two', 'first', 10));
    expect((await wf.getState('t-two')).status).toBe('suspended');
    await collect(wf.resolveAwakeable('t-two', 'second', 5));
    const state = await wf.getState('t-two');
    expect(state.status).toBe('completed');
    expect(state.state.total).toBe(15);
  });
});

describe('serializeAwakeableRef / parseAwakeableRef', () => {
  it('round-trips the address triple, URI-encoding awkward segments', () => {
    const ref = {
      workflowId: 'billing:prod',
      threadId: 'thread_01HZX',
      name: 'approve payment #7',
    };
    const raw = serializeAwakeableRef(ref);
    expect(raw.startsWith('wf:')).toBe(true);
    expect(parseAwakeableRef(raw)).toEqual(ref);
  });

  it('parse returns null on malformed input instead of throwing (untrusted callback data)', () => {
    expect(parseAwakeableRef('nope')).toBeNull();
    expect(parseAwakeableRef('wf:only:two')).toBeNull();
    expect(parseAwakeableRef('wf:a:b:c:d')).toBeNull();
    expect(parseAwakeableRef('wf::b:c')).toBeNull();
    expect(parseAwakeableRef('wf:%:b:c')).toBeNull();
  });

  it('serialize rejects empty segments eagerly', () => {
    expect(() => serializeAwakeableRef({ workflowId: '', threadId: 't', name: 'n' })).toThrow(
      TypeError,
    );
  });
});
