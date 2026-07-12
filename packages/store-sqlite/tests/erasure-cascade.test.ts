/**
 * W-005: session hard-delete cascades into the suspended-run snapshots
 * (`workflow_checkpoints` / `workflow_pending_writes`), which persist
 * the FULL serialized conversation.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createSqliteStore,
  type GraphorinSqliteStore,
  SESSION_SCOPED_PURGES,
  SESSION_TABLE_EXEMPTIONS,
} from '../src/index.js';
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

  it('GATE (W-060): every table with a session column is in the purge registry or exempted with a reason', async () => {
    const store = await makeStore();
    const tables = store.connection.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const covered = new Set(SESSION_SCOPED_PURGES.map((p) => p.table));
    const exempt = new Set(Object.keys(SESSION_TABLE_EXEMPTIONS));
    const undecided: string[] = [];
    for (const { name } of tables) {
      const cols = store.connection.all<{ name: string }>(`PRAGMA table_info(${name})`);
      const hasSessionColumn = cols.some(
        (c) => c.name === 'scope_session_id' || c.name === 'session_id',
      );
      if (!hasSessionColumn) continue;
      if (!covered.has(name) && !exempt.has(name)) undecided.push(name);
    }
    // A new table with a session column MUST get an erasure decision:
    // add it to SESSION_SCOPED_PURGES or to SESSION_TABLE_EXEMPTIONS
    // (with the reason erasure is still complete).
    expect(undecided).toEqual([]);
    // The registry and exemptions must not drift to nonexistent tables.
    const live = new Set(tables.map((t) => t.name));
    for (const entry of SESSION_SCOPED_PURGES) expect(live.has(entry.table)).toBe(true);
    for (const name of exempt) expect(live.has(name)).toBe(true);
    // Every exemption carries a human-readable reason.
    for (const reason of Object.values(SESSION_TABLE_EXEMPTIONS)) {
      expect(reason.length).toBeGreaterThan(10);
    }
  });

  it('W-029: session-scoped facts/insights/rules/blocks/spans die with the session; user-scoped rows survive', async () => {
    const store = await makeStore();
    await createSession(store, 's-full');
    const now = new Date().toISOString();
    // Session-scoped fact (FTS row via the write path) + entity link.
    await store.memory.semantic.remember({
      id: 'f-sess',
      kind: 'semantic',
      userId: 'alex',
      sessionId: 's-full',
      sensitivity: 'internal',
      text: 'session-scoped: prefers window seats',
      createdAt: now,
    });
    // User-scoped fact - must survive.
    await store.memory.semantic.remember({
      id: 'f-user',
      kind: 'semantic',
      userId: 'alex',
      sensitivity: 'internal',
      text: 'user-scoped: allergic to peanuts',
      createdAt: now,
    });
    // Entity + link referencing the session fact (FK: link must go first).
    store.connection.run(
      "INSERT INTO entities (id, scope_user_id, name, normalized_name, created_at) VALUES ('e1', 'alex', 'Window', 'window', ?)",
      [Date.now()],
    );
    store.connection.run(
      "INSERT INTO fact_entities (fact_id, entity_id, role, created_at) VALUES ('f-sess', 'e1', 'object', ?)",
      [Date.now()],
    );
    // History rows for the session fact: keyed + value-matching.
    store.connection.run(
      `INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, created_at)
       VALUES ('fact', 'f-sess', NULL, 'session-scoped: prefers window seats', 'ADD', 'agent', ?)`,
      [Date.now()],
    );
    store.connection.run(
      `INSERT INTO memory_history (memory_kind, memory_id, prev_value, new_value, event, source, created_at)
       VALUES ('fact', 'f-elsewhere', 'session-scoped: prefers window seats', NULL, 'SUPERSEDE', 'agent', ?)`,
      [Date.now()],
    );
    // Insight (base + FTS row, mirroring SqliteInsightStore.insert).
    store.connection.run(
      `INSERT INTO insights (id, scope_user_id, scope_session_id, text, cites_json, salience, provenance, status, sensitivity, created_at)
       VALUES ('i-sess', 'alex', 's-full', 'insight from the session', '[]', 2, 'reflection', 'quarantined', 'internal', ?)`,
      [Date.now()],
    );
    store.connection.run(
      "INSERT INTO insights_fts (rowid, text) VALUES ((SELECT rowid FROM insights WHERE id = 'i-sess'), 'insight from the session')",
    );
    // Rule scoped to the session (through the write path so rules_fts fills).
    await store.memory.procedural.add({
      id: 'r-sess',
      kind: 'procedural',
      userId: 'alex',
      sessionId: 's-full',
      sensitivity: 'internal',
      text: 'when in session, do the thing',
      condition: 'always',
      priority: 1,
      createdAt: now,
    });
    // Working block scoped to the session.
    await store.memory.working.upsert(
      { userId: 'alex', sessionId: 's-full' },
      {
        id: 'b-sess',
        kind: 'working',
        userId: 'alex',
        sessionId: 's-full',
        sensitivity: 'internal',
        label: 'scratch',
        value: 'scratch content',
        charLimit: 200,
        createdAt: now,
      },
    );
    // Span row keyed to the session.
    store.connection.run(
      `INSERT INTO spans (span_id, trace_id, parent_id, type, name, start_unix_nano, end_unix_nano, status, attributes_json, events_json, session_id)
       VALUES ('sp1', 'tr1', NULL, 'agent.run', 'agent.run', 1, 2, 'ok', '{}', '[]', 's-full')`,
    );

    await store.sessions.deleteSession('s-full');

    const count = (sql: string, params: unknown[] = []) =>
      store.connection.get<{ n: number }>(sql, params)?.n ?? -1;
    expect(count("SELECT COUNT(*) AS n FROM facts WHERE id = 'f-sess'")).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM facts WHERE id = 'f-user'")).toBe(1);
    expect(count("SELECT COUNT(*) AS n FROM fact_entities WHERE fact_id = 'f-sess'")).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM insights WHERE id = 'i-sess'")).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM rules WHERE id = 'r-sess'")).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM working_blocks WHERE id = 'b-sess'")).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM spans WHERE session_id = 's-full'")).toBe(0);
    // FTS sidecars are gone (search the shadow tables directly).
    expect(count("SELECT COUNT(*) AS n FROM facts_fts WHERE facts_fts MATCH 'window'")).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM insights_fts WHERE insights_fts MATCH 'insight'")).toBe(
      0,
    );
    // History rows survive as event skeletons but carry no content.
    expect(
      count(
        "SELECT COUNT(*) AS n FROM memory_history WHERE memory_kind = 'fact' AND (prev_value LIKE '%window seats%' OR new_value LIKE '%window seats%')",
      ),
    ).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM memory_history WHERE memory_id = 'f-sess'")).toBe(1);
    // The user-scoped fact remains findable.
    const hits = await store.memory.semantic.search({ userId: 'alex' }, { query: 'peanuts' });
    expect(hits.length).toBe(1);
  });

  it('wave-D D2: a user-scoped block survives session deletion; working.purge hard-deletes it', async () => {
    const store = await makeStore();
    const now = new Date().toISOString();
    const userScope = { userId: 'alex' };
    await store.memory.working.upsert(userScope, {
      id: 'b-profile',
      kind: 'working',
      userId: 'alex',
      sensitivity: 'internal',
      label: 'profile',
      value: 'identity:\n- name: Alex [f1]',
      charLimit: 400,
      readOnly: true,
      createdAt: now,
    });
    await store.memory.working.upsert(
      { userId: 'alex', sessionId: 's-peer' },
      {
        id: 'b-peer-profile',
        kind: 'working',
        userId: 'alex',
        sessionId: 's-peer',
        sensitivity: 'internal',
        label: 'profile',
        value: 'per-peer profile',
        charLimit: 400,
        createdAt: now,
      },
    );

    // The session cascade removes ONLY the session-scoped variant.
    await store.sessions.deleteSession('s-peer');
    const count = (sql: string) => store.connection.get<{ n: number }>(sql)?.n ?? -1;
    expect(count("SELECT COUNT(*) AS n FROM working_blocks WHERE id = 'b-peer-profile'")).toBe(0);
    expect(count("SELECT COUNT(*) AS n FROM working_blocks WHERE id = 'b-profile'")).toBe(1);

    // delete() is a tombstone (row survives); purge() is the erasure path.
    await store.memory.working.delete(userScope, 'profile');
    expect(count("SELECT COUNT(*) AS n FROM working_blocks WHERE id = 'b-profile'")).toBe(1);
    expect(typeof store.memory.working.purge).toBe('function');
    await store.memory.working.purge?.(userScope, 'profile');
    expect(count("SELECT COUNT(*) AS n FROM working_blocks WHERE id = 'b-profile'")).toBe(0);
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
