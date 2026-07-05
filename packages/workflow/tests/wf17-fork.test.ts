import { collect } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import { createNode, createWorkflow, InMemoryCheckpointStore, latestValue } from '../src/index.js';

describe('WF-17 - fork() produces a self-contained, continuable thread', () => {
  it('resets parentId on the forked root (no dangling lineage into the source thread)', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const wf = createWorkflow<{ value: number }>({
      name: 'fork-lineage',
      channels: { value: latestValue<number>({ default: 0 }) },
      nodes: {
        a: createNode<{ value: number }>({ name: 'a', run: () => ({ value: 1 }) }),
        b: createNode<{ value: number }>({ name: 'b', run: (s) => ({ value: s.value + 1 }) }),
      },
      edges: [
        { from: '__start__', to: 'a' },
        { from: 'a', to: 'b' },
        { from: 'b', to: '__end__' },
      ],
      checkpointStore,
    });
    await collect(wf.execute({}, { threadId: 'lineage-src' }));
    const checkpoints = await wf.listCheckpoints('lineage-src');
    const latest = [...checkpoints].sort((a, b) => a.stepNumber - b.stepNumber).at(-1);
    if (!latest) throw new Error('expected checkpoints');
    expect(latest.parentId).toBeDefined(); // the source latest HAS lineage

    const { newThreadId } = await wf.fork('lineage-src', latest.id);
    const forked = await wf.listCheckpoints(newThreadId);
    expect(forked).toHaveLength(1);
    // The forked root must not point at a checkpoint that only exists
    // in the SOURCE thread.
    expect(forked[0]?.parentId).toBeUndefined();
  });

  it('copies pendingWrites so a forked failed thread can retry without re-running succeeded tasks', async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    let okRuns = 0;
    let failNextRun = true;
    const wf = createWorkflow<{ done: string[] }>({
      name: 'fork-retry',
      channels: {
        done: latestValue<string[]>({ default: [] }),
      },
      nodes: {
        fan: createNode<{ done: string[] }>({ name: 'fan', run: () => ({}) }),
        ok: createNode<{ done: string[] }>({
          name: 'ok',
          run: (s) => {
            okRuns += 1;
            return { done: [...s.done, 'ok'] };
          },
        }),
        flaky: createNode<{ done: string[] }>({
          name: 'flaky',
          run: (s) => {
            if (failNextRun) {
              failNextRun = false;
              throw new Error('transient failure');
            }
            return { done: [...s.done, 'flaky'] };
          },
        }),
      },
      edges: [
        { from: '__start__', to: 'fan' },
        { from: 'fan', to: 'ok' },
        { from: 'fan', to: 'flaky' },
        { from: 'ok', to: '__end__' },
        { from: 'flaky', to: '__end__' },
      ],
      checkpointStore,
    });

    // Run to the partial failure: 'ok' succeeded, 'flaky' failed.
    try {
      await collect(wf.execute({}, { threadId: 'retry-src' }));
    } catch {
      // failed run may throw after emitting events
    }
    const srcCheckpoints = await wf.listCheckpoints('retry-src');
    const failed = [...srcCheckpoints].sort((a, b) => a.stepNumber - b.stepNumber).at(-1);
    if (!failed) throw new Error('expected a failed checkpoint');
    expect(okRuns).toBe(1);

    const { newThreadId } = await wf.fork('retry-src', failed.id);
    // The forked thread retries: the succeeded task's writes replay from
    // the COPIED pendingWrites; only the flaky node re-runs.
    await collect(wf.retry(newThreadId));
    expect(okRuns).toBe(1); // 'ok' did NOT re-run on the fork
    const state = await wf.getState(newThreadId);
    expect(state.status).toBe('completed');
    expect((state.state as { done: string[] }).done.sort()).toEqual(['flaky', 'ok']);
  });
});
