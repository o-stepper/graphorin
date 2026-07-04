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

  /** RP-6: retention sweep — delete every session matching the policy. */
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
    this.#conn.run('DELETE FROM session_handoffs WHERE session_id = ?', [sessionId]);
    this.#conn.run('DELETE FROM session_workflow_runs WHERE session_id = ?', [sessionId]);
    this.#conn.run('DELETE FROM session_audit WHERE session_id = ?', [sessionId]);
    this.#conn.run('DELETE FROM sessions WHERE id = ?', [sessionId]);
  }

  /**
   * store-01: a hard-delete must remove the CONTENT, not just the registry
   * rows. Pre-fix, nothing anywhere deleted `session_messages` (nor its
   * FTS/vec index rows), so a "deleted" conversation stayed permanently
   * searchable via `memory.session.list/search` — misleading for a
   * privacy-positioned framework and a GDPR hazard for the RP-6 retention
   * sweep. Episodes scoped to the session are purged for the same reason:
   * they quote the session's content. Caller owns the transaction.
   */
  #purgeSessionContent(sessionId: string): void {
    // Index rows first (they key off the base rows' rowid / id). The vec0
    // deletes mirror the proven per-id pattern of the fact `purge()` path —
    // sqlite-vec virtual tables handle `WHERE <id_col> = ?` reliably.
    this.#conn.run(
      `DELETE FROM session_messages_fts WHERE rowid IN
         (SELECT rowid FROM session_messages WHERE scope_session_id = ?)`,
      [sessionId],
    );
    const messageVecTables = this.#contentVecTables('session_messages_vec_');
    if (messageVecTables.length > 0) {
      const messageIds = this.#conn
        .all<{ id: string }>('SELECT id FROM session_messages WHERE scope_session_id = ?', [
          sessionId,
        ])
        .map((r) => r.id);
      for (const table of messageVecTables) {
        for (const id of messageIds) {
          this.#conn.run(`DELETE FROM ${table} WHERE message_id = ?`, [id]);
        }
      }
    }
    this.#conn.run('DELETE FROM session_messages WHERE scope_session_id = ?', [sessionId]);

    this.#conn.run(
      `DELETE FROM episodes_fts WHERE rowid IN
         (SELECT rowid FROM episodes WHERE scope_session_id = ?)`,
      [sessionId],
    );
    const episodeVecTables = this.#contentVecTables('episodes_vec_');
    if (episodeVecTables.length > 0) {
      const episodeIds = this.#conn
        .all<{ id: string }>('SELECT id FROM episodes WHERE scope_session_id = ?', [sessionId])
        .map((r) => r.id);
      for (const table of episodeVecTables) {
        for (const id of episodeIds) {
          this.#conn.run(`DELETE FROM ${table} WHERE episode_id = ?`, [id]);
        }
      }
    }
    this.#conn.run('DELETE FROM episodes WHERE scope_session_id = ?', [sessionId]);
  }

  /** Discover per-embedder vec0 tables by prefix, identifier-validated. */
  #contentVecTables(prefix: 'session_messages_vec_' | 'episodes_vec_'): string[] {
    const rows = this.#conn.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE ? ESCAPE '\\'",
      [`${prefix.replace(/_/g, '\\_')}%`],
    );
    return rows.map((r) => r.name).filter((name) => /^[A-Za-z0-9_]+$/.test(name));
  }
}

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
