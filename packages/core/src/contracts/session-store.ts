import type { HandoffRecord } from '../types/handoff.js';
import type { SessionScope } from '../types/session-scope.js';

/**
 * Lightweight session metadata persisted by the sessions package. The
 * actual `session_messages` rows are owned by `MemoryStore` (single source
 * of truth — the sessions package delegates message CRUD to memory).
 *
 * @stable
 */
export interface SessionMetadata {
  readonly id: string;
  readonly userId: string;
  readonly agentId: string;
  readonly title?: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly closedAt?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Agent registry entry. Captures stable metadata about every agent that
 * ever produced a message — so JSONL exports / replays can resolve a
 * `Message.agentId` to a human-readable name even after the agent was
 * renamed or retired.
 *
 * @stable
 */
export interface AgentRegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly registeredAt: string;
  readonly retiredAt?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Workflow ↔ session mapping row. Lets the server enumerate the
 * workflows attached to a session for resume / replay flows.
 *
 * @stable
 */
export interface SessionWorkflowRun {
  readonly sessionId: string;
  readonly workflowId: string;
  readonly threadId: string;
  readonly attachedAt: string;
  readonly status: 'running' | 'suspended' | 'completed' | 'failed';
}

/**
 * Session lifecycle audit event. The `@graphorin/sessions` package
 * appends one row per noteworthy lifecycle step (`created`, `closed`,
 * `forked`, `replayed`, `cassette-recorded`, `cassette-replayed`,
 * `commentary-sanitized`, …) plus per-session-handoff. Adapters can
 * surface the rows verbatim from disk.
 *
 * The `metadata` field is intentionally an open record — storage
 * adapters serialize it as JSON. Callers should keep it small and
 * never include secret values.
 *
 * @stable
 */
export interface SessionAuditEntry {
  readonly id: string;
  readonly sessionId: string;
  readonly action: string;
  readonly at: string;
  readonly actor?: {
    readonly kind: string;
    readonly id: string;
    readonly label?: string;
  };
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Pluggable session-metadata storage. Implementations live in the
 * storage adapter packages.
 *
 * @stable
 */
export interface SessionStore {
  createSession(metadata: SessionMetadata): Promise<void>;
  getSession(sessionId: string): Promise<SessionMetadata | null>;
  listSessions(
    scope: Pick<SessionScope, 'userId' | 'agentId'>,
  ): Promise<ReadonlyArray<SessionMetadata>>;
  updateSession(sessionId: string, patch: Partial<SessionMetadata>): Promise<void>;
  closeSession(sessionId: string, closedAt: string): Promise<void>;

  registerAgent(entry: AgentRegistryEntry): Promise<void>;
  retireAgent(agentId: string, retiredAt: string): Promise<void>;
  resolveAgent(agentId: string): Promise<AgentRegistryEntry | null>;

  appendHandoff(sessionId: string, record: HandoffRecord): Promise<void>;
  listHandoffs(sessionId: string): Promise<ReadonlyArray<HandoffRecord>>;

  attachWorkflowRun(run: SessionWorkflowRun): Promise<void>;
  listWorkflowRuns(sessionId: string): Promise<ReadonlyArray<SessionWorkflowRun>>;
}

/**
 * Optional extension surface for storage adapters that expose the
 * additional capabilities `@graphorin/sessions` consumes.
 * Adapters that opt out leave the property undefined; the sessions
 * facade degrades gracefully (delete becomes retire; audit rows are
 * dropped on the floor with a one-time WARN).
 *
 * Implementations: `SqliteSessionStore` (`@graphorin/store-sqlite`).
 *
 * @stable
 */
export interface SessionStoreExt extends SessionStore {
  /** Hard-delete an agent. Used by `AgentRegistry.delete(...)`. */
  deleteAgent(agentId: string): Promise<void>;
  /** List all known agents (including retired ones). */
  listAgents(): Promise<ReadonlyArray<AgentRegistryEntry>>;
  /** Update the status of a workflow attachment. */
  updateWorkflowRunStatus(
    sessionId: string,
    workflowId: string,
    threadId: string,
    status: SessionWorkflowRun['status'],
  ): Promise<void>;
  /** Append a session-lifecycle audit row. */
  appendAuditEntry(entry: SessionAuditEntry): Promise<void>;
  /** List recent audit rows for a session, newest-first. */
  listAuditEntries(
    sessionId: string,
    opts?: { readonly limit?: number },
  ): Promise<ReadonlyArray<SessionAuditEntry>>;
  /** Delete audit rows older than the supplied epoch ms. */
  pruneAuditEntries(beforeEpochMs: number): Promise<number>;
  /**
   * Hard-delete a session and cascade its session-owned rows — handoffs,
   * workflow-run attachments, and audit entries (RP-6) — **plus the
   * session's content**: its `session_messages` rows (with their FTS and
   * vector index entries) and any episodes scoped to the session
   * (store-01). After this call the conversation is no longer retrievable
   * through `memory.session.*` search surfaces. A no-op for an unknown id.
   */
  deleteSession(sessionId: string): Promise<void>;
  /**
   * Retention sweep (RP-6): hard-delete (cascade) every session matching the
   * policy. `beforeEpochMs` limits to sessions created before that instant;
   * `closedOnly` limits to closed sessions. With neither, deletes all sessions.
   * Returns the number of sessions deleted.
   */
  pruneSessions(opts: {
    readonly beforeEpochMs?: number;
    readonly closedOnly?: boolean;
  }): Promise<number>;
}
