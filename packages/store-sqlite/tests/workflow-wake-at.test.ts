/**
 * W-032: migration 032 (workflow_checkpoints.wake_at) + the
 * SqliteCheckpointStore.listSuspended enumeration used by the durable
 * timer driver. Latest-per-thread policy: a thread whose newest
 * checkpoint resumed or completed never fires.
 */
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CheckpointMetadata } from '@graphorin/core/contracts';
import { describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

const NS = 'workflow/timers';
const WAKE = Date.parse('2030-01-01T00:00:00.000Z');

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-wake-at-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return store;
}

async function seed(
  store: GraphorinSqliteStore,
  threadId: string,
  steps: ReadonlyArray<{ readonly status: CheckpointMetadata['status']; readonly wakeAt?: number }>,
): Promise<void> {
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i] as { status: CheckpointMetadata['status']; wakeAt?: number };
    await store.checkpoints.put(
      threadId,
      NS,
      {
        id: `${threadId}:cp-${i + 1}`,
        threadId,
        namespace: NS,
        state: { i },
        channelVersions: {},
        stepNumber: i + 1,
        createdAt: new Date().toISOString(),
      },
      {
        source: 'sync',
        status: step.status,
        ...(step.wakeAt !== undefined ? { wakeAt: step.wakeAt } : {}),
      },
    );
  }
}

describe('W-032 - migration 032 and listSuspended', () => {
  it('round-trips metadata.wakeAt through the wake_at column', async () => {
    const store = await makeStore();
    await seed(store, 't-roundtrip', [{ status: 'suspended', wakeAt: WAKE }]);
    const tuple = await store.checkpoints.getTuple('t-roundtrip', NS);
    expect(tuple?.metadata.wakeAt).toBe(WAKE);
    await store.close();
  });

  it('enumerates only latest-suspended threads with a due wakeAt', async () => {
    const store = await makeStore();
    // Due suspended thread.
    await seed(store, 't-due', [{ status: 'suspended', wakeAt: WAKE }]);
    // Not yet due.
    await seed(store, 't-later', [{ status: 'suspended', wakeAt: WAKE + 60_000 }]);
    // Was suspended with a timer, then completed - must never fire.
    await seed(store, 't-moved-on', [
      { status: 'suspended', wakeAt: WAKE },
      { status: 'completed' },
    ]);
    // Suspended without a timer (awakeable/approval).
    await seed(store, 't-no-timer', [{ status: 'suspended' }]);

    const due = await store.checkpoints.listSuspended?.(NS, { dueBefore: WAKE + 1 });
    expect(due).toEqual([{ threadId: 't-due', wakeAt: WAKE }]);

    const all = await store.checkpoints.listSuspended?.(NS);
    expect(all?.map((d) => d.threadId).sort()).toEqual(['t-due', 't-later']);

    const limited = await store.checkpoints.listSuspended?.(NS, { limit: 1 });
    expect(limited).toEqual([{ threadId: 't-due', wakeAt: WAKE }]);
    await store.close();
  });

  it('is namespace-scoped', async () => {
    const store = await makeStore();
    await seed(store, 't-x', [{ status: 'suspended', wakeAt: WAKE }]);
    const other = await store.checkpoints.listSuspended?.('workflow/other', {
      dueBefore: WAKE + 1,
    });
    expect(other).toEqual([]);
    await store.close();
  });

  it('pre-032 rows (wake_at NULL) stay invisible to the driver', async () => {
    const store = await makeStore();
    await seed(store, 't-legacy', [{ status: 'suspended' }]);
    expect(await store.checkpoints.listSuspended?.(NS, { dueBefore: Number.MAX_SAFE_INTEGER })).toEqual(
      [],
    );
    await store.close();
  });
});
