import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSqliteStore, SqliteConflictStore } from '../src/index.js';

const SCOPE = { userId: 'alex', sessionId: 's1' };

async function open(): Promise<{
  store: Awaited<ReturnType<typeof createSqliteStore>>;
  close: () => Promise<void>;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-conflict-store-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return {
    store,
    async close() {
      await store.close();
    },
  };
}

describe('SqliteConflictStore — Phase 10b audit + pending queue', () => {
  it('exposed on the SqliteMemoryStore.conflicts property', async () => {
    const { store, close } = await open();
    try {
      expect(store.memory.conflicts).toBeInstanceOf(SqliteConflictStore);
    } finally {
      await close();
    }
  });

  it('records every decision with stable stage / decision identifiers', async () => {
    const { store, close } = await open();
    try {
      const conflicts = store.memory.conflicts;
      const a = await conflicts.recordDecision({
        scope: SCOPE,
        candidateId: 'fact-1',
        decision: 'admit',
        stage: 'embedding-three-zone',
        reason: 'no-existing-candidates',
      });
      expect(a.id).toBeGreaterThan(0);
      expect(a.detectedAt).toBeGreaterThan(0);
      const b = await conflicts.recordDecision({
        scope: SCOPE,
        candidateId: 'fact-2',
        existingId: 'fact-1',
        decision: 'supersede',
        stage: 'heuristic-regex',
        detectionZone: 'heuristic',
        reason: 'regex-supersede-marker',
      });
      expect(b.id).toBeGreaterThan(a.id);
      const recent = await conflicts.listRecentDecisions(SCOPE);
      expect(recent.length).toBe(2);
      expect(recent[0]?.candidateId).toBe('fact-2');
      expect(recent[0]?.decision).toBe('supersede');
      expect(recent[0]?.detectionZone).toBe('heuristic');
      expect(recent[1]?.candidateId).toBe('fact-1');
    } finally {
      await close();
    }
  });

  it('enqueues pending conflicts and surfaces them via listPending(...)', async () => {
    const { store, close } = await open();
    try {
      const conflicts = store.memory.conflicts;
      const enq = await conflicts.enqueuePending({
        scope: SCOPE,
        factId: 'fact-3',
        candidateText: 'I love hiking but maybe I prefer cycling',
        stage: 'defer-to-deep',
        reason: 'awaiting-deep-llm-judge',
        conflictingIds: ['fact-1', 'fact-2'],
      });
      expect(enq.id).toBeGreaterThan(0);
      const pending = await conflicts.listPending(SCOPE);
      expect(pending.length).toBe(1);
      expect(pending[0]?.factId).toBe('fact-3');
      expect(pending[0]?.candidateText).toContain('hiking');
      expect(pending[0]?.stage).toBe('defer-to-deep');
      expect(pending[0]?.resolvedAt).toBeNull();
      expect([...(pending[0]?.conflictingIds ?? [])]).toEqual(['fact-1', 'fact-2']);
    } finally {
      await close();
    }
  });

  it('listPending defaults conflictingIds to empty array when none enqueued', async () => {
    const { store, close } = await open();
    try {
      const conflicts = store.memory.conflicts;
      await conflicts.enqueuePending({
        scope: SCOPE,
        factId: 'fact-no-conflicts',
        candidateText: 'isolated candidate',
        stage: 'defer-to-deep',
      });
      const pending = await conflicts.listPending(SCOPE);
      expect(pending[0]?.conflictingIds).toEqual([]);
    } finally {
      await close();
    }
  });

  it('markResolved hides the row from listPending(...)', async () => {
    const { store, close } = await open();
    try {
      const conflicts = store.memory.conflicts;
      const enq = await conflicts.enqueuePending({
        scope: SCOPE,
        factId: 'fact-4',
        candidateText: 'something ambiguous',
        stage: 'defer-to-deep',
      });
      await conflicts.markResolved(enq.id, 'admit');
      const pending = await conflicts.listPending(SCOPE);
      expect(pending.length).toBe(0);
    } finally {
      await close();
    }
  });

  it('isolates pending rows per user (scope guard)', async () => {
    const { store, close } = await open();
    try {
      const conflicts = store.memory.conflicts;
      await conflicts.enqueuePending({
        scope: { userId: 'alex' },
        factId: 'fA',
        candidateText: 'a',
        stage: 'defer-to-deep',
      });
      await conflicts.enqueuePending({
        scope: { userId: 'bob' },
        factId: 'fB',
        candidateText: 'b',
        stage: 'defer-to-deep',
      });
      const alex = await conflicts.listPending({ userId: 'alex' });
      const bob = await conflicts.listPending({ userId: 'bob' });
      expect(alex.map((r) => r.factId)).toEqual(['fA']);
      expect(bob.map((r) => r.factId)).toEqual(['fB']);
    } finally {
      await close();
    }
  });
});
