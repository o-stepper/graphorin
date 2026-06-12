/**
 * Integration test against the real `@graphorin/store-sqlite`
 * `SqliteCheckpointStore`. Verifies that the workflow runtime
 * round-trips through the production durable backend — the package
 * works without the in-memory fixtures, against the SQLite stack that
 * ships with v0.1.
 *
 * Tests use `:memory:` SQLite + `skipSqliteVec: true` so the suite
 * runs without the native `sqlite-vec` build.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collect } from '@graphorin/core';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';

import { createNode, createWorkflow, Directive, latestValue, pause } from '../src/index.js';

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-workflow-integration-'));
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    skipSqliteVec: true,
  });
  await store.init();
  return store;
}

interface State {
  status: 'idle' | 'awaiting' | 'done';
  decision?: 'go' | 'stop';
}

describe('@graphorin/workflow <> @graphorin/store-sqlite', () => {
  it('persists checkpoints + survives a fresh runtime instance', async () => {
    const store = await makeStore();
    try {
      const buildWorkflow = () =>
        createWorkflow<State>({
          name: 'sqlite-roundtrip',
          channels: {
            status: latestValue<State['status']>({ default: 'idle' }),
            decision: latestValue<State['decision']>(),
          },
          nodes: {
            wait: createNode<State>({
              name: 'wait',
              run: async () => {
                const decision = pause<{ kind: 'await' }, 'go' | 'stop'>({ kind: 'await' });
                return { decision, status: 'done' };
              },
            }),
          },
          edges: [
            { from: '__start__', to: 'wait' },
            { from: 'wait', to: '__end__' },
          ],
          checkpointStore: store.checkpoints,
        });

      const writer = buildWorkflow();
      const events = await collect(writer.execute({}, { threadId: 'sqlite-1' }));
      const suspended = events.find((e) => e.type === 'workflow.suspended');
      expect(suspended).toBeDefined();

      const reader = buildWorkflow();
      const snapshot = await reader.getState('sqlite-1');
      expect(snapshot.status).toBe('suspended');
      expect(snapshot.pendingPause?.nodeName).toBe('wait');

      const resumed = await collect(reader.resume('sqlite-1', new Directive({ resume: 'go' })));
      const final = resumed[resumed.length - 1];
      expect(final?.type).toBe('workflow.end');
      if (final?.type === 'workflow.end') {
        expect(final.state.decision).toBe('go');
      }

      const checkpoints = await reader.listCheckpoints('sqlite-1');
      expect(checkpoints.length).toBeGreaterThan(0);
    } finally {
      await store.close();
    }
  });

  it('forks a thread end-to-end through the SQLite store', async () => {
    const store = await makeStore();
    try {
      const wf = createWorkflow<{ value: number }>({
        name: 'sqlite-fork',
        channels: { value: latestValue<number>({ default: 0 }) },
        nodes: {
          inc: createNode<{ value: number }>({
            name: 'inc',
            run: (state) => ({ value: state.value + 1 }),
          }),
        },
        edges: [
          { from: '__start__', to: 'inc' },
          { from: 'inc', to: '__end__' },
        ],
        checkpointStore: store.checkpoints,
      });

      await collect(wf.execute({ value: 5 }, { threadId: 'fork-source' }));
      const checkpoints = await wf.listCheckpoints('fork-source');
      const middle = checkpoints[Math.floor(checkpoints.length / 2)];
      if (!middle) throw new Error('expected a middle checkpoint');
      const { newThreadId } = await wf.fork('fork-source', middle.id);
      const cloned = await wf.getState(newThreadId);
      expect(cloned.threadId).toBe(newThreadId);
    } finally {
      await store.close();
    }
  });
});
