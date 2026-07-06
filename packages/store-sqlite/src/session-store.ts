import type {
  HandoffInputFilterDescriptor,
  HandoffRecord,
  HandoffSecretsInheritance,
  SessionScope,
} from '@graphorin/core';
import type {
  AgentRegistryEntry,
  SessionAuditEntry,
  SessionMetadata,
  SessionStoreExt,
  SessionWorkflowRun,
} from '@graphorin/core/contracts';
import type { SqliteConnection } from './connection.js';

/**
 * Default `SessionStore` implementation. Owns:
 *   - `sessions` rows.
 *   - `agents_registry` rows.
 *   - `session_handoffs` rows.
 *   - `session_workflow_runs` mapping.
 *   - `session_audit` lifecycle rows.
 *
 * Per `DEC-147`, the actual `session_messages` rows live in
 * `@graphorin/store-sqlite`'s `MemoryStore` (single source of truth).
 *
 * @stable
 */
export class SqliteSessionStore implements SessionStoreExt {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async createSession(metadata: SessionMetadata): Promise<void> {
    this.#conn.run(
      `INSERT INTO sessions (id, user_id, agent_id, title, tags_json, created_at, updated_at, closed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        metadata.id,
        metadata.userId,
        metadata.agentId,
        metadata.title ?? null,
        metadata.tags ? JSON.stringify(metadata.tags) : null,
        Date.parse(metadata.createdAt),
        metadata.updatedAt ? Date.parse(metadata.updatedAt) : null,
        metadata.closedAt ? Date.parse(metadata.closedAt) : null,
      ],
    );
  }

  async getSession(sessionId: string): Promise<SessionMetadata | null> {
    const row = this.#conn.get<SessionRow>('SELECT * FROM sessions WHERE id = ?', [sessionId]);
    return row ? rowToSession(row) : null;
  }

  async listSessions(
    scope: Pick<SessionScope, 'userId' | 'agentId'>,
  ): Promise<ReadonlyArray<SessionMetadata>> {
    const conditions = ['user_id = ?'];
    const params: unknown[] = [scope.userId];
    if (scope.agentId !== undefined) {
      conditions.push('agent_id = ?');
      params.push(scope.agentId);
    }
    const rows = this.#conn.all<SessionRow>(
      `SELECT * FROM sessions WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(rowToSession);
  }

  async updateSession(sessionId: string, patch: Partial<SessionMetadata>): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (patch.title !== undefined) {
      fields.push('title = ?');
      params.push(patch.title);
    }
    if (patch.tags !== undefined) {
      fields.push('tags_json = ?');
      params.push(JSON.stringify(patch.tags));
    }
    fields.push('updated_at = ?');
    params.push(Date.now());
    params.push(sessionId);
    this.#conn.run(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  async closeSession(sessionId: string, closedAt: string): Promise<void> {
    this.#conn.run('UPDATE sessions SET closed_at = ? WHERE id = ?', [
      Date.parse(closedAt),
      sessionId,
    ]);
  }

  async registerAgent(entry: AgentRegistryEntry): Promise<void> {
    this.#conn.run(
      `INSERT OR REPLACE INTO agents_registry (id, display_name, registered_at, retired_at, tags_json) VALUES (?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.displayName,
        Date.parse(entry.registeredAt),
        entry.retiredAt ? Date.parse(entry.retiredAt) : null,
        entry.tags ? JSON.stringify(entry.tags) : null,
      ],
    );
  }

  async retireAgent(agentId: string, retiredAt: string): Promise<void> {
    this.#conn.run('UPDATE agents_registry SET retired_at = ? WHERE id = ?', [
      Date.parse(retiredAt),
      agentId,
    ]);
  }

  async deleteAgent(agentId: string): Promise<void> {
    this.#conn.run('DELETE FROM agents_registry WHERE id = ?', [agentId]);
  }

  async resolveAgent(agentId: string): Promise<AgentRegistryEntry | null> {
    const row = this.#conn.get<AgentRegistryRow>('SELECT * FROM agents_registry WHERE id = ?', [
      agentId,
    ]);
    return row ? rowToAgent(row) : null;
  }

  async listAgents(): Promise<ReadonlyArray<AgentRegistryEntry>> {
    const rows = this.#conn.all<AgentRegistryRow>(
      'SELECT * FROM agents_registry ORDER BY registered_at',
    );
    return rows.map(rowToAgent);
  }

  async appendHandoff(sessionId: string, record: HandoffRecord): Promise<void> {
    const id = `handoff-${sessionId}-${Date.parse(record.at)}-${record.stepNumber}`;
    this.#conn.run(
      `INSERT INTO session_handoffs (
         id, session_id, from_agent_id, to_agent_id, step_number, reason,
         input_filter_kind, input_filter_meta_json, secrets_inheritance,
         inherited_secrets_json, secrets_override_reason, at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sessionId,
        record.fromAgentId,
        record.toAgentId,
        record.stepNumber,
        record.reason ?? null,
        record.inputFilter?.kind ?? null,
        record.inputFilter?.meta ? JSON.stringify(record.inputFilter.meta) : null,
        record.secretsInheritance ?? null,
        record.inheritedSecrets ? JSON.stringify(record.inheritedSecrets) : null,
        record.secretsOverrideReason ?? null,
        Date.parse(record.at),
      ],
    );
  }

  async listHandoffs(sessionId: string): Promise<ReadonlyArray<HandoffRecord>> {
    const rows = this.#conn.all<HandoffRow>(
      'SELECT * FROM session_handoffs WHERE session_id = ? ORDER BY at',
      [sessionId],
    );
    return rows.map(rowToHandoff);
  }

  async attachWorkflowRun(run: SessionWorkflowRun): Promise<void> {
    this.#conn.run(
      `INSERT OR REPLACE INTO session_workflow_runs (session_id, workflow_id, thread_id, status, attached_at) VALUES (?, ?, ?, ?, ?)`,
      [run.sessionId, run.workflowId, run.threadId, run.status, Date.parse(run.attachedAt)],
    );
  }

  async updateWorkflowRunStatus(
    sessionId: string,
    workflowId: string,
    threadId: string,
    status: SessionWorkflowRun['status'],
  ): Promise<void> {
    this.#conn.run(
      'UPDATE session_workflow_runs SET status = ? WHERE session_id = ? AND workflow_id = ? AND thread_id = ?',
      [status, sessionId, workflowId, threadId],
    );
  }

  async listWorkflowRuns(sessionId: string): Promise<ReadonlyArray<SessionWorkflowRun>> {
    const rows = this.#conn.all<WorkflowRunRow>(
      'SELECT * FROM session_workflow_runs WHERE session_id = ? ORDER BY attached_at',
      [sessionId],
    );
    return rows.map(
      (row): SessionWorkflowRun => ({
        sessionId: row.session_id,
        workflowId: row.workflow_id,
        threadId: row.thread_id,
        status: row.status,
        attachedAt: new Date(row.attached_at).toISOString(),
      }),
    );
  }

  async appendAuditEntry(entry: SessionAuditEntry): Promise<void> {
    this.#conn.run(
      `INSERT INTO session_audit (id, session_id, action, actor_kind, actor_id, actor_label, metadata_json, at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.sessionId,
        entry.action,
        entry.actor?.kind ?? null,
        entry.actor?.id ?? null,
        entry.actor?.label ?? null,
        entry.metadata !== undefined ? JSON.stringify(entry.metadata) : null,
        Date.parse(entry.at),
      ],
    );
  }

  async listAuditEntries(
    sessionId: string,
    opts: { readonly limit?: number } = {},
  ): Promise<ReadonlyArray<SessionAuditEntry>> {
    const limit = opts.limit ?? 100;
    const rows = this.#conn.all<AuditRow>(
      'SELECT * FROM session_audit WHERE session_id = ? ORDER BY at DESC LIMIT ?',
      [sessionId, limit],
    );
    return rows.map(rowToAudit);
  }

  async pruneAuditEntries(beforeEpochMs: number): Promise<number> {
    const result = this.#conn.run('DELETE FROM session_audit WHERE at < ?', [beforeEpochMs]);
    return result.changes ?? 0;
  }

  /** RP-6: hard-delete a session + its handoffs / workflow runs / audit rows. */
  async deleteSession(sessionId: string): Promise<void> {
    this.#conn.transaction(() => {
      this.#deleteSessionCascade(sessionId);
    });
  }

  /** RP-6: retention sweep - delete every session matching the policy. */
  async pruneSessions(opts: {
    readonly beforeEpochMs?: number;
    readonly closedOnly?: boolean;
  }): Promise<number> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (opts.closedOnly === true) conditions.push('closed_at IS NOT NULL');
    if (opts.beforeEpochMs !== undefined) {
      conditions.push('created_at < ?');
      params.push(opts.beforeEpochMs);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const ids = this.#conn
      .all<{ id: string }>(`SELECT id FROM sessions ${where}`, params)
      .map((r) => r.id);
    this.#conn.transaction(() => {
      for (const id of ids) this.#deleteSessionCascade(id);
    });
    return ids.length;
  }

  /** Cascade-delete one session's rows. Caller owns the transaction. */
  #deleteSessionCascade(sessionId: string): void {
    this.#purgeSessionContent(sessionId);
    // W-005: suspended-run snapshots persist the FULL conversation
    // (serialized RunState) in workflow_checkpoints. Collect the thread
    // ids from BOTH linkage sources - the session_workflow_runs mapping
    // (workflow threads attached via Session.attachWorkflowRun) and the
    // session_id column stamped by the agent runtime on HITL suspends -
    // and erase them BEFORE the mapping rows disappear below.
    const threadIds = new Set<string>();
    for (const row of this.#conn.all<{ thread_id: string }>(
      'SELECT thread_id FROM session_workflow_runs WHERE session_id = ?',
      [sessionId],
    )) {
      threadIds.add(row.thread_id);
    }
    for (const row of this.#conn.all<{ thread_id: string }>(
      'SELECT DISTINCT thread_id FROM workflow_checkpoints WHERE session_id = ?',
      [sessionId],
    )) {
      threadIds.add(row.thread_id);
    }
    for (const threadId of threadIds) {
      this.#conn.run('DELETE FROM workflow_pending_writes WHERE thread_id = ?', [threadId]);
      this.#conn.run('DELETE FROM workflow_checkpoints WHERE thread_id = ?', [threadId]);
    }
    this.#conn.run('DELETE FROM session_handoffs WHERE session_id = ?', [sessionId]);
    this.#conn.run('DELETE FROM session_workflow_runs WHERE session_id = ?', [sessionId]);
    this.#conn.run('DELETE FROM session_audit WHERE session_id = ?', [sessionId]);
    this.#conn.run('DELETE FROM sessions WHERE id = ?', [sessionId]);
  }

  /**
   * store-01 / W-029: a hard-delete must remove the CONTENT, not just
   * the registry rows. The purge is driven by the declarative
   * {@link SESSION_SCOPED_PURGES} registry so completeness is enforced
   * by construction: a schema-introspection gate test asserts that
   * EVERY table carrying a `scope_session_id` / `session_id` column is
   * either an entry here or explicitly exempted with a reason. Only
   * rows whose session column equals the deleted session are removed -
   * user-level rows (`scope_session_id IS NULL`) are untouched.
   * Caller owns the transaction.
   */
  #purgeSessionContent(sessionId: string): void {
    for (const purge of SESSION_SCOPED_PURGES) {
      this.#purgeOne(purge, sessionId);
    }
  }

  /** Execute one registry entry: sidecars first, then the base rows. */
  #purgeOne(purge: SessionScopedPurge, sessionId: string): void {
    const { table, sessionColumn } = purge;
    // FTS shadow rows key off the base rows' rowid - delete them first.
    if (purge.fts !== undefined) {
      this.#conn.run(
        `DELETE FROM ${purge.fts} WHERE rowid IN
           (SELECT rowid FROM ${table} WHERE ${sessionColumn} = ?)`,
        [sessionId],
      );
    }
    // Per-embedder vec0 sidecars mirror the proven per-id pattern of the
    // fact purge() path - sqlite-vec virtual tables handle
    // `WHERE <id_col> = ?` reliably.
    if (purge.vec !== undefined) {
      const vecTables = this.#contentVecTables(purge.vec.prefix);
      if (vecTables.length > 0) {
        const ids = this.#conn
          .all<{ id: string }>(`SELECT id FROM ${table} WHERE ${sessionColumn} = ?`, [sessionId])
          .map((r) => r.id);
        for (const vecTable of vecTables) {
          for (const id of ids) {
            this.#conn.run(`DELETE FROM ${vecTable} WHERE ${purge.vec.idColumn} = ?`, [id]);
          }
        }
      }
    }
    // store-04 parity: content must not survive in the audit trail.
    // Scrub the history VALUES (keeping the event skeleton) for every
    // deleted row, mirroring MemoryStore.purge(): (a) rows keyed to the
    // id, and (b) for facts, rows VALUE-matching the text (a SUPERSEDE
    // row carries the new fact's text on the OLD fact's id).
    if (purge.history !== undefined) {
      const rows = this.#conn.all<{ id: string; body: string | null }>(
        `SELECT id, ${purge.history.textColumn} AS body FROM ${table} WHERE ${sessionColumn} = ?`,
        [sessionId],
      );
      for (const row of rows) {
        this.#conn.run(
          `UPDATE memory_history SET prev_value = NULL, new_value = NULL
           WHERE memory_kind = ? AND memory_id = ?`,
          [purge.history.kind, row.id],
        );
        if (purge.history.valueMatch && row.body !== null) {
          this.#conn.run(
            `UPDATE memory_history SET prev_value = NULL WHERE memory_kind = ? AND prev_value = ?`,
            [purge.history.kind, row.body],
          );
          this.#conn.run(
            `UPDATE memory_history SET new_value = NULL WHERE memory_kind = ? AND new_value = ?`,
            [purge.history.kind, row.body],
          );
        }
      }
    }
    // Referencing tables (FK with `foreign_keys = ON`) before the base
    // rows, or the whole cascade would roll back (CS-1 precedent).
    for (const ref of purge.refs ?? []) {
      this.#conn.run(
        `DELETE FROM ${ref.table} WHERE ${ref.column} IN
           (SELECT id FROM ${table} WHERE ${sessionColumn} = ?)`,
        [sessionId],
      );
    }
    this.#conn.run(`DELETE FROM ${table} WHERE ${sessionColumn} = ?`, [sessionId]);
  }

  /** Discover per-embedder vec0 tables by prefix, identifier-validated. */
  #contentVecTables(prefix: string): string[] {
    // Registry prefixes are compile-time literals validated by
    // VALID_IDENTIFIER below; escape their underscores for LIKE.
    const pattern = `${prefix.replaceAll('_', '\\_')}%`;
    const rows = this.#conn.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE ? ESCAPE '\\'",
      [pattern],
    );
    return rows.map((r) => r.name).filter((name) => /^[A-Za-z0-9_]+$/.test(name));
  }
}

/**
 * One entry of the session-content purge registry: which table holds
 * session-scoped rows, which column scopes them, and which sidecars
 * (FTS shadow, per-embedder vec0 tables, FK-referencing tables,
 * memory-history value scrub) must go with them.
 *
 * @stable
 */
export interface SessionScopedPurge {
  /** Base table holding the session-scoped rows. */
  readonly table: string;
  /** Column carrying the session id. */
  readonly sessionColumn: 'scope_session_id' | 'session_id';
  /** FTS5 shadow table joined by rowid, when the table has one. */
  readonly fts?: string;
  /** Per-embedder vec0 sidecar family (name prefix + id column). */
  readonly vec?: { readonly prefix: string; readonly idColumn: string };
  /** Tables referencing the base rows - cleared BEFORE the base rows. */
  readonly refs?: ReadonlyArray<{ readonly table: string; readonly column: string }>;
  /**
   * Scrub `memory_history` values for the deleted rows (store-04
   * parity). `valueMatch` additionally clears history rows whose
   * values equal the deleted row's text (the SUPERSEDE shape).
   */
  readonly history?: {
    readonly kind: string;
    readonly textColumn: string;
    readonly valueMatch: boolean;
  };
}

const VALID_IDENTIFIER = /^[A-Za-z0-9_]+$/;

/**
 * Declarative registry of every session-scoped CONTENT surface the
 * session hard-delete cascade purges (W-029/W-060). The gate test in
 * `tests/erasure-cascade.test.ts` diffs this list (plus
 * {@link SESSION_TABLE_EXEMPTIONS}) against the live schema: a new
 * table with a session column fails the suite until its author decides
 * how erasure covers it.
 *
 * @stable
 */
export const SESSION_SCOPED_PURGES: ReadonlyArray<SessionScopedPurge> = Object.freeze(
  (
    [
      {
        table: 'session_messages',
        sessionColumn: 'scope_session_id',
        fts: 'session_messages_fts',
        vec: { prefix: 'session_messages_vec_', idColumn: 'message_id' },
      },
      {
        table: 'episodes',
        sessionColumn: 'scope_session_id',
        fts: 'episodes_fts',
        vec: { prefix: 'episodes_vec_', idColumn: 'episode_id' },
        history: { kind: 'episode', textColumn: 'summary', valueMatch: false },
      },
      {
        table: 'facts',
        sessionColumn: 'scope_session_id',
        fts: 'facts_fts',
        vec: { prefix: 'facts_vec_', idColumn: 'fact_id' },
        refs: [{ table: 'fact_entities', column: 'fact_id' }],
        history: { kind: 'fact', textColumn: 'text', valueMatch: true },
      },
      {
        table: 'insights',
        sessionColumn: 'scope_session_id',
        fts: 'insights_fts',
        history: { kind: 'insight', textColumn: 'text', valueMatch: false },
      },
      { table: 'rules', sessionColumn: 'scope_session_id', fts: 'rules_fts' },
      { table: 'working_blocks', sessionColumn: 'scope_session_id' },
      { table: 'spans', sessionColumn: 'session_id' },
      { table: 'consolidator_state', sessionColumn: 'scope_session_id' },
      { table: 'consolidator_runs', sessionColumn: 'scope_session_id' },
    ] satisfies ReadonlyArray<SessionScopedPurge>
  ).map((entry) => {
    // Defense in depth: every identifier interpolated into SQL above
    // must be a plain identifier, even though all values are
    // compile-time literals in this module.
    const names = [
      entry.table,
      entry.sessionColumn,
      entry.fts,
      entry.vec?.prefix,
      entry.vec?.idColumn,
      entry.history?.textColumn,
      ...(entry.refs ?? []).flatMap((r) => [r.table, r.column]),
    ];
    for (const name of names) {
      if (name !== undefined && !VALID_IDENTIFIER.test(name)) {
        throw new Error(`SESSION_SCOPED_PURGES: invalid identifier '${name}'`);
      }
    }
    return entry;
  }),
);

/**
 * Session-column-bearing tables intentionally NOT in
 * {@link SESSION_SCOPED_PURGES}, each with the reason erasure is still
 * complete. Consumed by the completeness gate test.
 *
 * @stable
 */
export const SESSION_TABLE_EXEMPTIONS: Readonly<Record<string, string>> = Object.freeze({
  session_audit: 'lifecycle audit rows - deleted directly by #deleteSessionCascade',
  session_handoffs: 'handoff bookkeeping - deleted directly by #deleteSessionCascade',
  session_workflow_runs:
    'session-to-thread mapping - consumed for checkpoint erasure, then deleted by #deleteSessionCascade',
  workflow_checkpoints:
    'erased by #deleteSessionCascade via thread-id collection across namespaces (W-005), not by a plain session-column delete',
});

interface SessionRow {
  id: string;
  user_id: string;
  agent_id: string;
  title: string | null;
  tags_json: string | null;
  created_at: number;
  updated_at: number | null;
  closed_at: number | null;
}

interface AgentRegistryRow {
  id: string;
  display_name: string;
  registered_at: number;
  retired_at: number | null;
  tags_json: string | null;
  metadata_json: string | null;
}

interface HandoffRow {
  id: string;
  session_id: string;
  from_agent_id: string;
  to_agent_id: string;
  step_number: number;
  reason: string | null;
  input_filter_kind: string | null;
  input_filter_meta_json: string | null;
  secrets_inheritance: string | null;
  inherited_secrets_json: string | null;
  secrets_override_reason: string | null;
  at: number;
}

interface WorkflowRunRow {
  session_id: string;
  workflow_id: string;
  thread_id: string;
  status: 'running' | 'suspended' | 'completed' | 'failed';
  attached_at: number;
}

interface AuditRow {
  id: string;
  session_id: string;
  action: string;
  actor_kind: string | null;
  actor_id: string | null;
  actor_label: string | null;
  metadata_json: string | null;
  at: number;
}

function rowToSession(row: SessionRow): SessionMetadata {
  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    ...(row.title !== null ? { title: row.title } : {}),
    ...(row.tags_json !== null ? { tags: JSON.parse(row.tags_json) } : {}),
    createdAt: new Date(row.created_at).toISOString(),
    ...(row.updated_at !== null ? { updatedAt: new Date(row.updated_at).toISOString() } : {}),
    ...(row.closed_at !== null ? { closedAt: new Date(row.closed_at).toISOString() } : {}),
  };
}

function rowToAgent(row: AgentRegistryRow): AgentRegistryEntry {
  return {
    id: row.id,
    displayName: row.display_name,
    registeredAt: new Date(row.registered_at).toISOString(),
    ...(row.retired_at !== null ? { retiredAt: new Date(row.retired_at).toISOString() } : {}),
    ...(row.tags_json !== null ? { tags: JSON.parse(row.tags_json) } : {}),
  };
}

function rowToHandoff(row: HandoffRow): HandoffRecord {
  let inputFilter: HandoffInputFilterDescriptor | undefined;
  if (row.input_filter_kind !== null) {
    const meta =
      row.input_filter_meta_json !== null
        ? (JSON.parse(row.input_filter_meta_json) as Readonly<Record<string, unknown>>)
        : undefined;
    inputFilter =
      meta !== undefined ? { kind: row.input_filter_kind, meta } : { kind: row.input_filter_kind };
  }
  let inheritedSecrets: ReadonlyArray<string> | undefined;
  if (row.inherited_secrets_json !== null) {
    const parsed = JSON.parse(row.inherited_secrets_json);
    if (Array.isArray(parsed)) {
      inheritedSecrets = parsed.filter((v): v is string => typeof v === 'string');
    }
  }
  return {
    fromAgentId: row.from_agent_id,
    toAgentId: row.to_agent_id,
    stepNumber: row.step_number,
    at: new Date(row.at).toISOString(),
    ...(row.reason !== null ? { reason: row.reason } : {}),
    ...(inputFilter !== undefined ? { inputFilter } : {}),
    ...(row.secrets_inheritance !== null
      ? { secretsInheritance: row.secrets_inheritance as HandoffSecretsInheritance }
      : {}),
    ...(inheritedSecrets !== undefined ? { inheritedSecrets } : {}),
    ...(row.secrets_override_reason !== null
      ? { secretsOverrideReason: row.secrets_override_reason }
      : {}),
  };
}

function rowToAudit(row: AuditRow): SessionAuditEntry {
  const actor =
    row.actor_kind !== null && row.actor_id !== null
      ? {
          kind: row.actor_kind,
          id: row.actor_id,
          ...(row.actor_label !== null ? { label: row.actor_label } : {}),
        }
      : undefined;
  const metadata =
    row.metadata_json !== null
      ? (JSON.parse(row.metadata_json) as Readonly<Record<string, unknown>>)
      : undefined;
  return {
    id: row.id,
    sessionId: row.session_id,
    action: row.action,
    at: new Date(row.at).toISOString(),
    ...(actor !== undefined ? { actor } : {}),
    ...(metadata !== undefined ? { metadata } : {}),
  };
}
