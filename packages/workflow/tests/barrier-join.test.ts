/**
 * WF-5: the Barrier channel's `@stable` contract — "completes when
 * every writer in `from` has produced a value" — must gate the join
 * node in the ENGINE, not just accumulate a keyed map. The adversarial
 * shape is the ASYMMETRIC fan-in: one writer arrives steps later than
 * the other, so any-of edge triggering runs the join early (with a
 * partial map) and then again (duplicate execution).
 */

import { collect } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import {
  barrier,
  createNode,
  createWorkflow,
  InMemoryCheckpointStore,
  latestValue,
} from '../src/index.js';

interface JoinState {
  joined?: Record<string, string>;
  out?: string;
}

/**
 * A barrier WRITE is the writer's single value; the channel merges it
 * under the writer's node name into the Record the readers see. The
 * state type carries the merged read shape, so write sites cast.
 */
function barrierWrite(value: string): Record<string, string> {
  return value as unknown as Record<string, string>;
}

describe('WF-5 — Barrier joins wait for every writer', () => {
  it('an ASYMMETRIC fan-in runs the join node exactly once, only after a AND c wrote', async () => {
    const joinRuns: Array<Record<string, string>> = [];
    const wf = createWorkflow<JoinState>({
      name: 'barrier-asym',
      channels: {
        joined: barrier<Record<string, string>>(['a', 'c']),
        out: latestValue<string>(),
      },
      nodes: {
        a: createNode<JoinState>({ name: 'a', run: () => ({ joined: barrierWrite('a-val') }) }),
        b: createNode<JoinState>({ name: 'b', run: () => ({}) }),
        c: createNode<JoinState>({ name: 'c', run: () => ({ joined: barrierWrite('c-val') }) }),
        join: createNode<JoinState>({
          name: 'join',
          run: (state) => {
            joinRuns.push({ ...(state.joined ?? {}) });
            return { out: 'joined' };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: '__start__', to: 'b' },
        // c arrives one step later than a — the asymmetric leg.
        { from: 'b', to: 'c' },
        { from: 'a', to: 'join' },
        { from: 'c', to: 'join' },
        { from: 'join', to: '__end__' },
      ],
      checkpointStore: new InMemoryCheckpointStore(),
    });

    const events = await collect(wf.execute({}, { threadId: 'bj-1' }));
    const end = events.at(-1);
    expect(end?.type).toBe('workflow.end');
    // Exactly ONE execution…
    expect(joinRuns).toHaveLength(1);
    // …and only with the COMPLETE barrier map.
    expect(joinRuns[0]).toEqual({ a: 'a-val', c: 'c-val' });
  });

  it('a symmetric diamond still joins once (regression guard)', async () => {
    const joinRuns: Array<Record<string, string>> = [];
    const wf = createWorkflow<JoinState>({
      name: 'barrier-sym',
      channels: {
        joined: barrier<Record<string, string>>(['a', 'c']),
        out: latestValue<string>(),
      },
      nodes: {
        a: createNode<JoinState>({ name: 'a', run: () => ({ joined: barrierWrite('a-val') }) }),
        c: createNode<JoinState>({ name: 'c', run: () => ({ joined: barrierWrite('c-val') }) }),
        join: createNode<JoinState>({
          name: 'join',
          run: (state) => {
            joinRuns.push({ ...(state.joined ?? {}) });
            return { out: 'joined' };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: '__start__', to: 'c' },
        { from: 'a', to: 'join' },
        { from: 'c', to: 'join' },
        { from: 'join', to: '__end__' },
      ],
      checkpointStore: new InMemoryCheckpointStore(),
    });

    const events = await collect(wf.execute({}, { threadId: 'bj-2' }));
    expect(events.at(-1)?.type).toBe('workflow.end');
    expect(joinRuns).toHaveLength(1);
    expect(joinRuns[0]).toEqual({ a: 'a-val', c: 'c-val' });
  });

  it('a barrier that can never complete dead-ends instead of running a partial join', async () => {
    const joinRuns: number[] = [];
    const wf = createWorkflow<JoinState>({
      name: 'barrier-starved',
      channels: {
        joined: barrier<Record<string, string>>(['a', 'ghost']),
        out: latestValue<string>(),
      },
      nodes: {
        a: createNode<JoinState>({ name: 'a', run: () => ({ joined: barrierWrite('a-val') }) }),
        // `ghost` is a declared barrier writer that exists but is never
        // scheduled — the join must not fire with the partial map.
        ghost: createNode<JoinState>({
          name: 'ghost',
          run: () => ({ joined: barrierWrite('ghost-val') }),
        }),
        join: createNode<JoinState>({
          name: 'join',
          run: () => {
            joinRuns.push(1);
            return { out: 'joined' };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: 'join' },
        { from: 'ghost', to: 'join' },
        { from: 'join', to: '__end__' },
      ],
      checkpointStore: new InMemoryCheckpointStore(),
    });

    const events = await collect(wf.execute({}, { threadId: 'bj-3' }));
    expect(joinRuns).toHaveLength(0);
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
