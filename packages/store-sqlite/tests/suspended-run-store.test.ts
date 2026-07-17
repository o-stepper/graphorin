import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-suspended-runs-'));
  const store = await createSqliteStore({
    path: `${dir}/db.sqlite`,
    skipSqliteVec: true,
  });
  await store.init();
  return store;
}

describe('SqliteSuspendedRunStore (migration 038)', () => {
  let store: GraphorinSqliteStore;
  beforeEach(async () => {
    store = await makeStore();
  });

  it('put + get round-trips a full record and omits null columns', async () => {
    await store.suspendedRuns.put({
      runId: 'run-1',
      agentId: 'assistant',
      sessionId: 's1',
      userId: 'alex',
      stateJson: '{"version":"graphorin-run-state/1.2"}',
      suspendedAt: 1_000,
    });
    const full = await store.suspendedRuns.get('run-1');
    expect(full).toEqual({
      runId: 'run-1',
      agentId: 'assistant',
      sessionId: 's1',
      userId: 'alex',
      stateJson: '{"version":"graphorin-run-state/1.2"}',
      suspendedAt: 1_000,
    });

    await store.suspendedRuns.put({
      runId: 'run-2',
      agentId: 'assistant',
      stateJson: '{}',
      suspendedAt: 2_000,
    });
    const sparse = await store.suspendedRuns.get('run-2');
    expect(sparse).toEqual({
      runId: 'run-2',
      agentId: 'assistant',
      stateJson: '{}',
      suspendedAt: 2_000,
    });
    expect(sparse).not.toHaveProperty('sessionId');
    expect(sparse).not.toHaveProperty('userId');
  });

  it('a re-put replaces the state but keeps the original suspendedAt', async () => {
    await store.suspendedRuns.put({
      runId: 'run-1',
      agentId: 'assistant',
      stateJson: '{"step":1}',
      suspendedAt: 1_000,
    });
    // A partially-resolved directive re-suspends with fresh state; the
    // row must keep answering "waiting since the FIRST park".
    await store.suspendedRuns.put({
      runId: 'run-1',
      agentId: 'assistant',
      sessionId: 'late-session',
      stateJson: '{"step":2}',
      suspendedAt: 9_000,
    });
    const rec = await store.suspendedRuns.get('run-1');
    expect(rec?.stateJson).toBe('{"step":2}');
    expect(rec?.sessionId).toBe('late-session');
    expect(rec?.suspendedAt).toBe(1_000);
  });

  it('list() returns every park oldest-first; delete() is idempotent', async () => {
    await store.suspendedRuns.put({
      runId: 'newer',
      agentId: 'a',
      stateJson: '{}',
      suspendedAt: 2_000,
    });
    await store.suspendedRuns.put({
      runId: 'older',
      agentId: 'a',
      stateJson: '{}',
      suspendedAt: 1_000,
    });
    expect((await store.suspendedRuns.list()).map((r) => r.runId)).toEqual(['older', 'newer']);

    await store.suspendedRuns.delete('older');
    await store.suspendedRuns.delete('older');
    expect((await store.suspendedRuns.list()).map((r) => r.runId)).toEqual(['newer']);
    expect(await store.suspendedRuns.get('older')).toBeUndefined();
  });

  it('deleteSession purges the session-scoped parks (erasure cascade)', async () => {
    await store.sessions.createSession({
      id: 'sess-purge',
      userId: 'alex',
      agentId: 'agent-1',
      createdAt: new Date().toISOString(),
    });
    await store.suspendedRuns.put({
      runId: 'scoped',
      agentId: 'a',
      sessionId: 'sess-purge',
      stateJson: '{"messages":["private"]}',
      suspendedAt: 1_000,
    });
    await store.suspendedRuns.put({
      runId: 'unscoped',
      agentId: 'a',
      stateJson: '{}',
      suspendedAt: 1_000,
    });

    await store.sessions.deleteSession('sess-purge');

    expect(await store.suspendedRuns.get('scoped')).toBeUndefined();
    expect(await store.suspendedRuns.get('unscoped')).toBeDefined();
  });
});
