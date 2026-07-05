import type { Message } from '@graphorin/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createSqliteStore,
  type GraphorinSqliteStore,
  type SqliteConsolidatorStateStore,
  type SqliteMemoryStore,
} from '../src/index.js';

function asConsolidator(store: GraphorinSqliteStore): SqliteConsolidatorStateStore {
  return (store.memory as SqliteMemoryStore).consolidator;
}

describe('SqliteConsolidatorStateStore', () => {
  let store: GraphorinSqliteStore;

  beforeEach(async () => {
    store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
    await store.init();
  });

  afterEach(async () => {
    await store.close();
  });

  it('upserts state and round-trips empty session/agent ids', async () => {
    const scope = { userId: 'alex' };
    const before = await asConsolidator(store).getState(scope);
    expect(before).toBeNull();
    await asConsolidator(store).upsertState(scope, {
      lastProcessedMessageId: 'msg_42',
      lastPhase: 'standard',
      lastCompletedAt: 1234,
    });
    const after = await asConsolidator(store).getState(scope);
    expect(after).toMatchObject({
      lastProcessedMessageId: 'msg_42',
      lastPhase: 'standard',
      lastCompletedAt: 1234,
    });
    expect(after?.scope.sessionId).toBeUndefined();
  });

  it('persists state per (user, session, agent) tuple', async () => {
    await asConsolidator(store).upsertState(
      { userId: 'alex', sessionId: 's1' },
      { lastProcessedMessageId: 'a' },
    );
    await asConsolidator(store).upsertState(
      { userId: 'alex', sessionId: 's2' },
      { lastProcessedMessageId: 'b' },
    );
    const s1 = await asConsolidator(store).getState({ userId: 'alex', sessionId: 's1' });
    const s2 = await asConsolidator(store).getState({ userId: 'alex', sessionId: 's2' });
    expect(s1?.lastProcessedMessageId).toBe('a');
    expect(s2?.lastProcessedMessageId).toBe('b');
  });

  it('upsertState never clobbers a concurrently acquired lock (store-07)', async () => {
    const scope = { userId: 'alex' };
    // Process A reads (lock free)… process B acquires… A patches an
    // UNRELATED field. Pre-fix A's read-merge-write wrote EVERY column
    // back, silently reverting B's lock to NULL - two consolidator
    // runs then raced.
    await asConsolidator(store).getState(scope);
    expect(await asConsolidator(store).acquireLock(scope, 'runner-b', 1_000, 60_000)).toBe(true);
    await asConsolidator(store).upsertState(scope, { lastCompletedAt: 5_000 });
    const after = await asConsolidator(store).getState(scope);
    expect(after?.lastCompletedAt).toBe(5_000);
    expect(after?.activeLockHeldBy).toBe('runner-b');
  });

  it('releaseLock is a no-op for a non-holder (store-07)', async () => {
    const scope = { userId: 'alex' };
    expect(await asConsolidator(store).acquireLock(scope, 'holder', 0, 60_000)).toBe(true);
    await asConsolidator(store).releaseLock(scope, 'someone-else');
    expect((await asConsolidator(store).getState(scope))?.activeLockHeldBy).toBe('holder');
    await asConsolidator(store).releaseLock(scope, 'holder');
    expect((await asConsolidator(store).getState(scope))?.activeLockHeldBy).toBeNull();
  });

  it('acquires + releases the lock idempotently', async () => {
    const scope = { userId: 'alex' };
    expect(await asConsolidator(store).acquireLock(scope, 'r1', 0, 60_000)).toBe(true);
    expect(await asConsolidator(store).acquireLock(scope, 'r1', 0, 60_000)).toBe(true);
    expect(await asConsolidator(store).acquireLock(scope, 'r2', 0, 60_000)).toBe(false);
    expect(await asConsolidator(store).acquireLock(scope, 'r2', 200_000, 60_000)).toBe(true);
    await asConsolidator(store).releaseLock(scope, 'r2');
    const after = await asConsolidator(store).getState(scope);
    expect(after?.activeLockHeldBy).toBeNull();
  });

  it('records run start + finish and surfaces them via listRecentRuns', async () => {
    const scope = { userId: 'alex' };
    await asConsolidator(store).recordRunStart({
      id: 'run_1',
      scope,
      triggerKind: 'turn',
      phase: 'light',
      startedAt: 100,
    });
    await asConsolidator(store).recordRunFinish({
      id: 'run_1',
      finishedAt: 200,
      status: 'completed',
      llmTokensUsed: 0,
      llmCostUsd: null,
      factsCreated: 0,
      factsUpdated: 1,
    });
    const runs = await asConsolidator(store).listRecentRuns(scope, 10);
    expect(runs.length).toBe(1);
    expect(runs[0]?.status).toBe('completed');
    expect(runs[0]?.factsUpdated).toBe(1);
  });

  it('manages the DLQ - enqueue / claim / reschedule / mark / exhaust', async () => {
    const scope = { userId: 'alex' };
    await asConsolidator(store).enqueueFailedBatch({
      id: 'b1',
      consolidatorRunId: null,
      scope,
      messageIds: ['msg_1', 'msg_2'],
      errorKind: 'rate_limit',
      errorMessage: '429 too fast',
      failedAt: 100,
      nextRetryAt: 200,
      retryCount: 0,
      phase: 'deep',
    });
    const ready = await asConsolidator(store).claimReadyBatches(scope, 250);
    expect(ready.length).toBe(1);
    expect(ready[0]?.messageIds).toEqual(['msg_1', 'msg_2']);
    // MCON-10 / migration 019: the failed phase round-trips.
    expect(ready[0]?.phase).toBe('deep');

    await asConsolidator(store).rescheduleBatch('b1', 1, 999);
    const stillReady = await asConsolidator(store).claimReadyBatches(scope, 100);
    expect(stillReady.length).toBe(0);
    const future = await asConsolidator(store).claimReadyBatches(scope, 1500);
    expect(future.length).toBe(1);
    expect(future[0]?.retryCount).toBe(1);

    await asConsolidator(store).markBatchExhausted('b1', 'permanent failure');
    const exhausted = await asConsolidator(store).listFailedBatches(scope);
    expect(exhausted.length).toBe(1);
    expect(exhausted[0]?.errorMessage).toBe('permanent failure');

    await asConsolidator(store).markBatchSucceeded('b1');
    const empty = await asConsolidator(store).listFailedBatches(scope);
    expect(empty.length).toBe(0);
  });

  it('W-065: pruneRuns deletes old terminal runs, keeps running and fresh ones', async () => {
    const scope = { userId: 'alex' };
    const c = asConsolidator(store);
    await c.recordRunStart({
      id: 'run-old',
      scope,
      triggerKind: 'periodic',
      phase: 'light',
      startedAt: Date.now() - 100_000,
    });
    await c.recordRunFinish({
      id: 'run-old',
      status: 'completed',
      finishedAt: Date.now() - 99_000,
    });
    await c.recordRunStart({
      id: 'run-live',
      scope,
      triggerKind: 'periodic',
      phase: 'light',
      startedAt: Date.now() - 100_000,
    });
    await c.recordRunStart({
      id: 'run-fresh',
      scope,
      triggerKind: 'periodic',
      phase: 'light',
      startedAt: Date.now(),
    });
    await c.recordRunFinish({ id: 'run-fresh', status: 'completed', finishedAt: Date.now() });

    const removed = await c.pruneRuns(Date.now() - 50_000);
    expect(removed).toBe(1);
    const left = store.connection
      .all<{ id: string }>('SELECT id FROM consolidator_runs ORDER BY id')
      .map((r) => r.id);
    expect(left).toEqual(['run-fresh', 'run-live']);
  });

  it('W-065: pruneExhaustedBatches deletes only exhausted batches past the cutoff', async () => {
    const scope = { userId: 'alex' };
    const c = asConsolidator(store);
    const mkBatch = (id: string, nextRetryAt: number | null, failedAt: number) =>
      c.enqueueFailedBatch({
        id,
        consolidatorRunId: null,
        scope,
        messageIds: ['m'],
        errorKind: 'x',
        errorMessage: 'x',
        failedAt,
        nextRetryAt,
        retryCount: 3,
        phase: 'deep',
      });
    await mkBatch('exhausted-old', null, Date.now() - 100_000);
    await mkBatch('exhausted-fresh', null, Date.now());
    await mkBatch('retrying-old', Date.now() + 60_000, Date.now() - 100_000);

    const removed = await c.pruneExhaustedBatches(Date.now() - 50_000);
    expect(removed).toBe(1);
    const left = store.connection
      .all<{ id: string }>('SELECT id FROM consolidator_failed_batches ORDER BY id')
      .map((r) => r.id);
    expect(left).toEqual(['exhausted-fresh', 'retrying-old']);
    // The batch awaiting retry is still claimable.
    const ready = await c.claimReadyBatches(scope, Date.now() + 120_000);
    expect(ready.map((b) => b.id)).toEqual(['retrying-old']);
  });
});

describe('SqliteSessionMemoryStore.listMessagesSince', () => {
  let store: GraphorinSqliteStore;

  beforeEach(async () => {
    store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
    await store.init();
  });

  afterEach(async () => {
    await store.close();
  });

  it('reads messages past the cursor in oldest-first order', async () => {
    const scope = { userId: 'alex', sessionId: 's1' };
    const message: Message = { role: 'user', content: 'first message' };
    const message2: Message = { role: 'user', content: 'second message' };
    const message3: Message = { role: 'user', content: 'third message' };
    const r1 = await store.memory.session.push(scope, message);
    await store.memory.session.push(scope, message2);
    await store.memory.session.push(scope, message3);

    const session = store.memory.session as unknown as {
      listMessagesSince(
        scope: { userId: string; sessionId: string },
        cursor: string | null,
        limit: number,
      ): Promise<ReadonlyArray<{ id: string; sequence: number }>>;
    };

    const all = await session.listMessagesSince(scope, null, 10);
    expect(all.length).toBe(3);
    expect(all[0]?.sequence).toBe(1);

    const past = await session.listMessagesSince(scope, r1.messageId, 10);
    expect(past.length).toBe(2);
    expect(past[0]?.sequence).toBe(2);
  });
});

describe('SqliteSemanticMemoryStore.listForDecay + archiveFact', () => {
  let store: GraphorinSqliteStore;

  beforeEach(async () => {
    store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
    await store.init();
  });

  afterEach(async () => {
    await store.close();
  });

  it('lists facts ordered by recency and supports soft-archive', async () => {
    const scope = { userId: 'alex' };
    await store.memory.semantic.remember({
      id: 'f1',
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      text: 'I love hiking',
      createdAt: new Date(0).toISOString(),
    });
    await store.memory.semantic.remember({
      id: 'f2',
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      text: 'I work as a designer',
      createdAt: new Date(1000).toISOString(),
    });
    const semantic = store.memory.semantic as unknown as {
      listForDecay(
        scope: { userId: string },
        limit?: number,
        opts?: { includeArchived?: boolean },
      ): Promise<ReadonlyArray<{ id: string; archived: boolean }>>;
      archiveFact(id: string, reason?: string): Promise<void>;
    };
    const before = await semantic.listForDecay(scope);
    expect(before.length).toBe(2);
    expect(before.every((row) => !row.archived)).toBe(true);
    await semantic.archiveFact('f1', 'low_retention');
    // MCON-6: the decay window drops archived rows; inspection opts in.
    const window = await semantic.listForDecay(scope);
    expect(window.map((r) => r.id)).toEqual(['f2']);
    const after = await semantic.listForDecay(scope, undefined, { includeArchived: true });
    const archived = after.find((r) => r.id === 'f1');
    expect(archived?.archived).toBe(true);
  });
  it('CS-8: exactly one of N concurrent acquireLock calls wins (atomic)', async () => {
    const scope = { userId: 'concurrent' };
    const c = asConsolidator(store);
    // Fire many acquireLock calls for distinct runIds at once. The
    // read-then-write window used to let several win; the conditional
    // UPSERT admits exactly one.
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => c.acquireLock(scope, `run-${i}`, 0, 60_000)),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    const state = await c.getState(scope);
    expect(state?.activeLockHeldBy).toMatch(/^run-\d+$/);
  });
});
