/**
 * W-005: session hard-delete cascades into the suspended-run snapshots
 * (`workflow_checkpoints` / `workflow_pending_writes`), which persist
 * the FULL serialized conversation.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSqliteStore, type GraphorinSqliteStore } from '../src/index.js';
import { listMigrations } from '../src/migrations/registry.js';

async function makeStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-erasure-cascade-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  return store;
}

function checkpointFixture(threadId: string, stepNumber = 1) {
  return {
    id: `${threadId}-cp-${stepNumber}`,
    threadId,
    namespace: 'agent',
    state: { sessionId: 's-erase', messages: [{ role: 'user', content: 'secret plans' }] },
    channelVersions: {},
    stepNumber,
    createdAt: new Date().toISOString(),
  };
}

async function createSession(store: GraphorinSqliteStore, id: string): Promise<void> {
  await store.sessions.createSession({
    id,
    userId: 'alex',
    agentId: 'agent-1',
    createdAt: new Date().toISOString(),
  });
}

describe('W-005 - checkpoint session linkage + delete cascade', () => {
  it('put() persists metadata.sessionId into the session_id column and reads it back', async () => {
    const store = await makeStore();
    await store.checkpoints.put('run-1', 'agent', checkpointFixture('run-1'), {
      source: 'sync',
      status: 'suspended',
      nodeName: 'agent.run',
      sessionId: 's-erase',
    });
    const row = store.connection.get<{ session_id: string | null }>(
      'SELECT session_id FROM workflow_checkpoints WHERE thread_id = ?',
      ['run-1'],
    );
    expect(row?.session_id).toBe('s-erase');
    const tuple = await store.checkpoints.getTuple('run-1', 'agent');
    expect(tuple?.metadata.sessionId).toBe('s-erase');
  });

  it('deleteSession erases checkpoints + pending writes linked via the session_id column (agent HITL path)', async () => {
    const store = await makeStore();
    await createSession(store, 's-erase');
    await store.checkpoints.put('run-hitl', 'agent', checkpointFixture('run-hitl'), {
      source: 'sync',
      status: 'suspended',
      sessionId: 's-erase',
    });
    await store.checkpoints.putWrites(
      'run-hitl',
      'agent',
      'run-hitl-cp-1',
      [{ taskId: 't1', index: 0, channel: 'ch', value: { leak: 'conversation' } }],
      't1',
    );
    // A checkpoint belonging to ANOTHER session must survive.
    await store.checkpoints.put('run-other', 'agent', checkpointFixture('run-other'), {
      source: 'sync',
      status: 'suspended',
      sessionId: 's-other',
    });

    await store.sessions.deleteSession('s-erase');

    const count = (sql: string, params: unknown[]) =>
      store.connection.get<{ n: number }>(sql, params)?.n ?? -1;
    expect(
      count('SELECT COUNT(*) AS n FROM workflow_checkpoints WHERE thread_id = ?', ['run-hitl']),
    ).toBe(0);
    expect(
      count('SELECT COUNT(*) AS n FROM workflow_pending_writes WHERE thread_id = ?', ['run-hitl']),
    ).toBe(0);
    expect(
      count('SELECT COUNT(*) AS n FROM workflow_checkpoints WHERE thread_id = ?', ['run-other']),
    ).toBe(1);
  });

  it('deleteSession erases checkpoints linked ONLY via session_workflow_runs (workflow path, no session_id column)', async () => {
    const store = await makeStore();
    await createSession(store, 's-wf');
    // Workflow engines do not stamp sessionId metadata today - the
    // linkage comes from Session.attachWorkflowRun.
    await store.checkpoints.put('wf-thread', 'my-flow', checkpointFixture('wf-thread'), {
      source: 'sync',
      status: 'suspended',
    });
    await store.sessions.attachWorkflowRun({
      sessionId: 's-wf',
      threadId: 'wf-thread',
      workflowId: 'my-flow',
      status: 'suspended',
      attachedAt: new Date().toISOString(),
    });

    await store.sessions.deleteSession('s-wf');

    const row = store.connection.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM workflow_checkpoints WHERE thread_id = ?',
      ['wf-thread'],
    );
    expect(row?.n).toBe(0);
  });

  it('pruneSessions runs the same cascade', async () => {
    const store = await makeStore();
    await createSession(store, 's-prune');
    await store.checkpoints.put('run-prune', 'agent', checkpointFixture('run-prune'), {
      source: 'sync',
      status: 'suspended',
      sessionId: 's-prune',
    });
    const removed = await store.sessions.pruneSessions({ beforeEpochMs: Date.now() + 60_000 });
    expect(removed).toBeGreaterThanOrEqual(1);
    const row = store.connection.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM workflow_checkpoints WHERE thread_id = ?',
      ['run-prune'],
    );
    expect(row?.n).toBe(0);
  });

  it("migration 029's backfill recovers session_id from legacy agent state blobs", async () => {
    const store = await makeStore();
    // A legacy-format row: written before the column was stamped.
    store.connection.run(
      `INSERT INTO workflow_checkpoints (
         id, thread_id, namespace, parent_id, state_json, channel_versions_json,
         step_number, source, status, node_name, tags_json, session_id, created_at
       ) VALUES (?, ?, 'agent', NULL, ?, '{}', 1, 'sync', 'suspended', NULL, NULL, NULL, ?)`,
      ['legacy-cp', 'legacy-run', JSON.stringify({ sessionId: 's-legacy' }), Date.now()],
    );
    // Run the REAL backfill statement from the bundled migration file.
    const migration = listMigrations().find((m) => m.version === '029');
    expect(migration).toBeDefined();
    const update = migration?.sql
      .split(';')
      .map((stmt) => stmt.trim())
      .find((stmt) => stmt.startsWith('UPDATE workflow_checkpoints'));
    expect(update).toBeDefined();
    store.connection.exec(`${update};`);
    const row = store.connection.get<{ session_id: string | null }>(
      'SELECT session_id FROM workflow_checkpoints WHERE id = ?',
      ['legacy-cp'],
    );
    expect(row?.session_id).toBe('s-legacy');
  });
});
