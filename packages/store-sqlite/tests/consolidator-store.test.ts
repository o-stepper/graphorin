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

  it('manages the DLQ — enqueue / claim / reschedule / mark / exhaust', async () => {
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
});
