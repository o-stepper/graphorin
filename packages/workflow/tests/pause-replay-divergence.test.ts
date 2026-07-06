/**
 * W-120 - positional pause replay is verified against the journaled
 * pause identity: a node whose pause ORDER depends on state fails
 * loudly with `pause-replay-divergence` instead of silently handing a
 * resume value to the wrong pause. Deterministic bodies and legacy
 * checkpoints (no satisfiedMeta) replay exactly as before.
 */
import { type CheckpointMetadata, pause } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import {
  awaitExternal,
  createNode,
  createWorkflow,
  Directive,
  InMemoryCheckpointStore,
  latestValue,
} from '../src/index.js';

async function drain<T>(events: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const ev of events) out.push(ev);
  return out;
}

interface FlipState {
  flip: boolean;
  first: string;
  second: string;
}

/** Node whose pause ORDER depends on `state.flip`. */
function flipWorkflow(store: InMemoryCheckpointStore) {
  return createWorkflow<FlipState>({
    name: 'flippy',
    channels: {
      flip: latestValue<boolean>() as never,
      first: latestValue<string>() as never,
      second: latestValue<string>() as never,
    },
    nodes: {
      waiter: createNode<FlipState>({
        name: 'waiter',
        run: (state) => {
          const first = state.flip
            ? awaitExternal<string>('beta')
            : awaitExternal<string>('alpha');
          const second = state.flip
            ? awaitExternal<string>('alpha')
            : awaitExternal<string>('beta');
          return { first, second };
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

/**
 * Node whose FIRST pause is a state-dependent awakeable and whose
 * second is a plain `pause()` - lets the legacy test diverge only in
 * the PREVIOUSLY-satisfied value.
 */
function flipThenPlainWorkflow(store: InMemoryCheckpointStore) {
  return createWorkflow<FlipState>({
    name: 'flippy-plain',
    channels: {
      flip: latestValue<boolean>() as never,
      first: latestValue<string>() as never,
      second: latestValue<string>() as never,
    },
    nodes: {
      waiter: createNode<FlipState>({
        name: 'waiter',
        run: (state) => {
          const first = state.flip
            ? awaitExternal<string>('beta')
            : awaitExternal<string>('alpha');
          const second = pause<string, string>('plain-gate');
          return { first, second };
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

describe('W-120 - pause replay divergence', () => {
  it('a state-dependent pause order fails with pause-replay-divergence', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = flipWorkflow(store);
    await drain(wf.execute({ flip: false } as never, { threadId: 't-div' }));
    // First resolve: 'alpha' answered; the thread re-suspends on 'beta'.
    await drain(wf.resolveAwakeable('t-div', 'alpha', 'A'));
    const state = await wf.getState('t-div');
    expect(state.status).toBe('suspended');
    expect(state.pendingPauses?.[0]?.name).toBe('beta');

    // Flip the branching state on the second resume: the body now asks
    // for 'beta' FIRST, so the journaled 'alpha' answer would land on
    // the wrong pause - the replay must fail loudly instead.
    const events = await drain(
      wf.resume('t-div', new Directive({ resume: 'B', update: { flip: true } })),
    );
    const last = events.at(-1);
    expect(last?.type).toBe('workflow.error');
    if (last?.type === 'workflow.error') {
      expect(last.error.code).toBe('pause-replay-divergence');
      expect(last.error.message).toContain("'waiter'");
      expect(last.error.message).toContain('alpha');
      expect(last.error.message).toContain('beta');
    }
  });

  it('a deterministic pause order replays exactly as before', async () => {
    const store = new InMemoryCheckpointStore();
    const wf = flipWorkflow(store);
    await drain(wf.execute({ flip: false } as never, { threadId: 't-ok' }));
    await drain(wf.resolveAwakeable('t-ok', 'alpha', 'A'));
    await drain(wf.resolveAwakeable('t-ok', 'beta', 'B'));
    const state = await wf.getState('t-ok');
    expect(state.status).toBe('completed');
    expect((state.state as FlipState).first).toBe('A');
    expect((state.state as FlipState).second).toBe('B');
  });

  it('legacy checkpoints: previously-satisfied values replay unchecked; fresh metadata still checks', async () => {
    // A store wrapper that strips satisfiedMeta from persisted frontier
    // tags - simulating checkpoints written before W-120. Only the
    // PREVIOUSLY-satisfied values lose their identity; the directive
    // value delivered at resume time always gets fresh metadata from
    // the live frontier record.
    const makeStrippingStore = () => {
      const inner = new InMemoryCheckpointStore();
      const stripMeta = (tags: ReadonlyArray<string> | undefined): string[] | undefined => {
        if (tags === undefined) return undefined;
        return tags.map((tag) => {
          const sep = tag.indexOf(':');
          const prefix = tag.slice(0, sep + 1);
          if (prefix !== 'frontier:' && prefix !== 'pause:') return tag;
          try {
            const parsed = JSON.parse(tag.slice(sep + 1)) as Record<string, unknown>;
            if (Array.isArray(parsed.pauses)) {
              for (const p of parsed.pauses as Array<Record<string, unknown>>) {
                delete p.satisfiedMeta;
              }
            }
            delete parsed.satisfiedMeta;
            return `${prefix}${JSON.stringify(parsed)}`;
          } catch {
            return tag;
          }
        });
      };
      return new Proxy(inner, {
        get(target, prop, receiver) {
          if (prop === 'put') {
            return (
              threadId: string,
              namespace: string,
              checkpoint: unknown,
              metadata: CheckpointMetadata,
              opts?: unknown,
            ) =>
              target.put(
                threadId,
                namespace,
                checkpoint as never,
                {
                  ...metadata,
                  ...(metadata.tags !== undefined ? { tags: stripMeta(metadata.tags) } : {}),
                } as CheckpointMetadata,
                opts as never,
              );
          }
          // Bind through to the target: the store uses #private fields,
          // which break when `this` is the proxy.
          const value = Reflect.get(target, prop, receiver);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    };

    // LEGACY: the old 'alpha' answer lands on 'beta' after the flip but
    // its stripped meta cannot flag it - the run completes positionally
    // (the documented pre-W-120 behavior). The plain second pause never
    // checks by design.
    const legacyStore = makeStrippingStore();
    const legacy = flipThenPlainWorkflow(legacyStore as never);
    await drain(legacy.execute({ flip: false } as never, { threadId: 't-legacy' }));
    await drain(legacy.resolveAwakeable('t-legacy', 'alpha', 'A'));
    const legacyEvents = await drain(
      legacy.resume('t-legacy', new Directive({ resume: 'B', update: { flip: true } })),
    );
    expect(legacyEvents.at(-1)?.type).not.toBe('workflow.error');
    expect((await legacy.getState('t-legacy')).status).toBe('completed');

    // CONTRAST: the same divergence WITH metadata intact is caught.
    const freshStore = new InMemoryCheckpointStore();
    const fresh = flipThenPlainWorkflow(freshStore);
    await drain(fresh.execute({ flip: false } as never, { threadId: 't-fresh' }));
    await drain(fresh.resolveAwakeable('t-fresh', 'alpha', 'A'));
    const freshEvents = await drain(
      fresh.resume('t-fresh', new Directive({ resume: 'B', update: { flip: true } })),
    );
    const last = freshEvents.at(-1);
    expect(last?.type).toBe('workflow.error');
    if (last?.type === 'workflow.error') {
      expect(last.error.code).toBe('pause-replay-divergence');
    }
  });
});
