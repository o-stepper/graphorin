/**
 * W-009: CheckpointStoreExt retention primitives - namespace-scoped
 * pruneThreads (suspended threads protected) and compactThread.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CheckpointMetadata } from '@graphorin/core/contracts';
import { describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

const HOUR = 3_600_000;

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-checkpoint-retention-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return store;
}

async function seed(
  store: GraphorinSqliteStore,
  threadId: string,
  namespace: string,
  args: {
    readonly steps?: number;
    readonly status: CheckpointMetadata['status'];
    readonly ageMs: number;
    readonly withWrites?: boolean;
  },
): Promise<void> {
  const steps = args.steps ?? 1;
  for (let step = 1; step <= steps; step += 1) {
    const id = `${threadId}:${namespace}:cp-${step}`;
    await store.checkpoints.put(
      threadId,
      namespace,
      {
        id,
        threadId,
        namespace,
        state: { step },
        channelVersions: {},
        stepNumber: step,
        createdAt: new Date(Date.now() - args.ageMs).toISOString(),
      },
      { source: 'sync', status: step === steps ? args.status : 'running' },
    );
    if (args.withWrites === true) {
      await store.checkpoints.putWrites(
        threadId,
        namespace,
        id,
        [{ taskId: 't', index: 0, channel: 'ch', value: step }],
        't',
      );
    }
  }
}

function counts(store: GraphorinSqliteStore, threadId: string, namespace: string) {
  const cp =
    store.connection.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM workflow_checkpoints WHERE thread_id = ? AND namespace = ?',
      [threadId, namespace],
    )?.n ?? -1;
  const pw =
    store.connection.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM workflow_pending_writes WHERE thread_id = ? AND namespace = ?',
      [threadId, namespace],
    )?.n ?? -1;
  return { cp, pw };
}

describe('SqliteCheckpointStore.pruneThreads (W-009)', () => {
  it('prunes old terminal threads (with pending writes), keeps suspended and fresh ones', async () => {
    const store = await makeStore();
    await seed(store, 'old-done', 'ns', { status: 'completed', ageMs: 2 * HOUR, withWrites: true });
    await seed(store, 'old-suspended', 'ns', { status: 'suspended', ageMs: 2 * HOUR });
    await seed(store, 'fresh-done', 'ns', { status: 'completed', ageMs: 0 });

    const pruned = await store.checkpoints.pruneThreads({
      beforeEpochMs: Date.now() - HOUR,
    });
    expect(pruned).toBe(1);
    expect(counts(store, 'old-done', 'ns')).toEqual({ cp: 0, pw: 0 });
    expect(counts(store, 'old-suspended', 'ns').cp).toBeGreaterThan(0);
    expect(counts(store, 'fresh-done', 'ns').cp).toBeGreaterThan(0);
  });

  it('onlyTerminal: false also prunes suspended threads', async () => {
    const store = await makeStore();
    await seed(store, 'old-suspended', 'ns', { status: 'suspended', ageMs: 2 * HOUR });
    const pruned = await store.checkpoints.pruneThreads({
      beforeEpochMs: Date.now() - HOUR,
      onlyTerminal: false,
    });
    expect(pruned).toBe(1);
    expect(counts(store, 'old-suspended', 'ns').cp).toBe(0);
  });

  it('REGRESSION: a reused threadId across namespaces - pruning terminal A leaves suspended B fully intact', async () => {
    const store = await makeStore();
    // Same thread id in two namespaces: workflow A finished long ago,
    // workflow B is suspended on a HITL approval of the same age.
    await seed(store, 'shared-thread', 'workflow/a', {
      status: 'completed',
      ageMs: 2 * HOUR,
      withWrites: true,
    });
    await seed(store, 'shared-thread', 'workflow/b', {
      status: 'suspended',
      ageMs: 2 * HOUR,
      withWrites: true,
    });

    const pruned = await store.checkpoints.pruneThreads({ beforeEpochMs: Date.now() - HOUR });
    expect(pruned).toBe(1);
    expect(counts(store, 'shared-thread', 'workflow/a')).toEqual({ cp: 0, pw: 0 });
    // Namespace B: checkpoints AND pending writes are untouched.
    const b = counts(store, 'shared-thread', 'workflow/b');
    expect(b.cp).toBeGreaterThan(0);
    expect(b.pw).toBeGreaterThan(0);
  });

  it('the latest checkpoint decides age: an old thread with a fresh latest step survives', async () => {
    const store = await makeStore();
    // Two checkpoints: step 1 old, step 2 fresh terminal.
    await store.checkpoints.put(
      't-mixed',
      'ns',
      {
        id: 'cp-1',
        threadId: 't-mixed',
        namespace: 'ns',
        state: {},
        channelVersions: {},
        stepNumber: 1,
        createdAt: new Date(Date.now() - 3 * HOUR).toISOString(),
      },
      { source: 'sync', status: 'running' },
    );
    await store.checkpoints.put(
      't-mixed',
      'ns',
      {
        id: 'cp-2',
        threadId: 't-mixed',
        namespace: 'ns',
        state: {},
        channelVersions: {},
        stepNumber: 2,
        createdAt: new Date().toISOString(),
      },
      { source: 'sync', status: 'completed' },
    );
    const pruned = await store.checkpoints.pruneThreads({ beforeEpochMs: Date.now() - HOUR });
    expect(pruned).toBe(0);
    expect(counts(store, 't-mixed', 'ns').cp).toBe(2);
  });
});

describe('SqliteCheckpointStore.compactThread (W-009)', () => {
  it('keeps exactly keepLast newest checkpoints of its pair; other namespaces untouched; orphan writes deleted', async () => {
    const store = await makeStore();
    await seed(store, 'compact-me', 'ns-a', {
      steps: 5,
      status: 'suspended',
      ageMs: 0,
      withWrites: true,
    });
    await seed(store, 'compact-me', 'ns-b', { steps: 3, status: 'suspended', ageMs: 0 });

    const deleted = await store.checkpoints.compactThread('compact-me', 'ns-a', 2);
    expect(deleted).toBe(3);
    expect(counts(store, 'compact-me', 'ns-a').cp).toBe(2);
    // Pending writes of the deleted checkpoints are gone; the two
    // survivors keep theirs.
    expect(counts(store, 'compact-me', 'ns-a').pw).toBe(2);
    expect(counts(store, 'compact-me', 'ns-b').cp).toBe(3);
    // The survivors are the NEWEST ones and the thread still resumes
    // from its latest tuple.
    const latest = await store.checkpoints.getTuple('compact-me', 'ns-a');
    expect(latest?.checkpoint.stepNumber).toBe(5);
  });

  it('clamps keepLast to >= 1 (never deletes the resume state)', async () => {
    const store = await makeStore();
    await seed(store, 'clamp', 'ns', { steps: 3, status: 'suspended', ageMs: 0 });
    await store.checkpoints.compactThread('clamp', 'ns', 0);
    const latest = await store.checkpoints.getTuple('clamp', 'ns');
    expect(latest?.checkpoint.stepNumber).toBe(3);
    expect(counts(store, 'clamp', 'ns').cp).toBe(1);
  });
});
