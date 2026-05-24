/**
 * `createSessionManager(...)` and the `Session` facade — the hybrid
 * facade-with-state surface for the sessions module. Per the
 * single-source-of-truth principle, this package OWNS sessions /
 * agents / handoffs / workflow attachments / audit metadata, and
 * DELEGATES message CRUD to `@graphorin/memory.session`. There is no
 * duplicate `session_messages` table, no separate FTS index, and no
 * message cache in this package.
 *
 * @packageDocumentation
 */

import type {
  AssistantMessage,
  HandoffRecord,
  MemoryHit,
  Message,
  MessageContent,
  MessageRef,
  SessionScope,
  SystemMessage,
  ToolMessage,
  UserMessage,
} from '@graphorin/core';
import type {
  AgentRegistryEntry,
  SessionAuditEntry,
  SessionListOptions,
  SessionMetadata,
  SessionStoreExt,
  SessionWorkflowRun,
} from '@graphorin/core/contracts';
import { AgentRegistry } from './agent-registry.js';
import {
  createToolCassetteRecorder,
  type ToolCassetteRecorder,
  type ToolCassetteRecorderOptions,
} from './cassette/recorder.js';
import {
  type CommentaryBoundary,
  type CommentaryPolicy,
  type CommentarySanitizationDecision,
  type CommentarySanitizer,
  createCommentarySanitizer,
} from './commentary/index.js';
import { SessionNotFoundError } from './errors/index.js';
import {
  readSessionExport,
  type SessionExportReadOptions,
  type SessionExportReadResult,
} from './export/reader.js';
import type {
  SessionExportAgentRecord,
  SessionExportAuditRecord,
  SessionExportFooterRecord,
  SessionExportHandoffRecord,
  SessionExportMessageRecord,
  SessionExportSessionRecord,
} from './export/types.js';
import {
  createSessionExportWriter,
  type SessionExportSink,
  type SessionExportWriter,
  type SessionExportWriterOptions,
} from './export/writer.js';
import { newId } from './internal/ids.js';
import {
  type CreateSessionReplayerOptions,
  createSessionReplayer,
  type SessionReplayEvent,
  type SessionReplayer,
  type SessionReplayOptions,
} from './replay/index.js';

/**
 * Subset of the `Memory.session` surface this package consumes. Kept
 * structural so callers can pass either the `Memory` facade from
 * `@graphorin/memory` or any custom shim with the same shape.
 *
 * @stable
 */
export interface SessionMemoryFacade {
  push(scope: SessionScope, message: Message): Promise<MessageRef>;
  list(scope: SessionScope, opts?: SessionListOptions): Promise<ReadonlyArray<Message>>;
  search(
    scope: SessionScope,
    query: string,
    opts?: { topK?: number; signal?: AbortSignal },
  ): Promise<ReadonlyArray<MemoryHit>>;
  flushImportant?(scope: SessionScope, opts?: { silent?: boolean }): Promise<{ flushed: number }>;
  compact?(
    scope: SessionScope,
    opts?: { keepLastN?: number },
  ): Promise<{ removed: number; summarized: number; summary?: string }>;
}

/**
 * Counter receiver used by the commentary sanitizer + the cassette
 * audit emissions. Defaults to a no-op. Hook your `@graphorin/observability`
 * meter into this when wiring the session manager into a server.
 *
 * @stable
 */
export interface SessionCounters {
  inc(name: string, value: number, labels?: Readonly<Record<string, string>>): void;
}

const NOOP_COUNTERS: SessionCounters = Object.freeze({
  inc(): void {
    // no-op
  },
});

/**
 * Per-session-manager configuration.
 *
 * @stable
 */
export interface CreateSessionManagerOptions {
  /** Storage adapter — `@graphorin/store-sqlite` is the default. */
  readonly store: SessionStoreExt;
  /** Memory facade — `@graphorin/memory.session` delegate target. */
  readonly memory: SessionMemoryFacade;
  /** Default commentary policy. Defaults to `'wrap'`. */
  readonly commentaryPolicy?: CommentaryPolicy;
  /** Replay engine configuration. */
  readonly replay?: CreateSessionReplayerOptions;
  /** Counter sink (no-op by default). */
  readonly counters?: SessionCounters;
  /** Test seam: override `Date.now()`. */
  readonly now?: () => number;
  /** Test seam: override the id generator. */
  readonly newId?: (prefix: string) => string;
}

/**
 * Per-session ergonomic facade returned by
 * {@link SessionManager.create} / {@link SessionManager.get}.
 *
 * @stable
 */
export interface Session {
  readonly id: string;
  readonly scope: SessionScope;
  /** Effective commentary policy for this session. */
  readonly commentaryPolicy: CommentaryPolicy;
  metadata(): Promise<SessionMetadata>;
  /** Persist a new message — wraps `memory.session.push(scope, ...)`. */
  push(message: Message): Promise<MessageRef>;
  /** List messages — wraps `memory.session.list(scope, ...)`. */
  list(opts?: SessionListOptions): Promise<ReadonlyArray<Message>>;
  /** Hybrid (FTS5) search over messages — wraps `memory.session.search(...)`. */
  search(
    query: string,
    opts?: { topK?: number; signal?: AbortSignal },
  ): Promise<ReadonlyArray<MemoryHit>>;
  /** Manual compaction — wraps `memory.session.compact(...)`. */
  compact(opts?: { keepLastN?: number }): Promise<{
    readonly removed: number;
    readonly summarized: number;
    readonly summary?: string;
  }>;
  /** Append a handoff record. Auto-fires from `Agent.toTool()` in `@graphorin/agent`. */
  appendHandoff(record: Omit<HandoffRecord, 'at'> & { at?: string }): Promise<HandoffRecord>;
  /** Every handoff in this session, oldest-first. */
  listHandoffs(): Promise<ReadonlyArray<HandoffRecord>>;
  /** Filter handoffs by agent + direction. */
  handoffsByAgent(
    agentId: string,
    direction?: 'from' | 'to' | 'both',
  ): Promise<ReadonlyArray<HandoffRecord>>;
  /** Attach a workflow run to this session. */
  attachWorkflowRun(
    run: Omit<SessionWorkflowRun, 'sessionId' | 'attachedAt'> & {
      readonly attachedAt?: string;
    },
  ): Promise<SessionWorkflowRun>;
  /** List workflow runs attached to this session. */
  workflowRuns(): Promise<ReadonlyArray<SessionWorkflowRun>>;
  /** Update a workflow run's status. */
  updateWorkflowRunStatus(
    workflowId: string,
    threadId: string,
    status: SessionWorkflowRun['status'],
  ): Promise<void>;
  /** Mark the session closed. Idempotent. */
  close(): Promise<void>;
  /**
   * Fork the session at a given point. Returns a fresh `Session`
   * with copied session-level metadata; the new session id is
   * autogenerated.
   *
   * Note: forking copies SESSION-level metadata only. Replicating
   * message rows is a downstream consumer concern — the agent runtime
   * iterates the source's `list({ sinceMessageId })` and writes via
   * `push()` on the new session as needed. Full message-replicating
   * forks remain post-v0.1.
   */
  fork(opts?: { readonly title?: string }): Promise<Session>;
  /** Stream the session as a JSONL session-export 1.0 document. */
  export(opts: SessionExportOptions): Promise<SessionExportFooterRecord>;
  /** Sanitized-by-default replay. */
  replay(
    opts?: SessionReplayOptions & {
      readonly traceSource?: Parameters<SessionReplayer['run']>[0]['traceSource'];
      readonly liveInvocation?: Parameters<SessionReplayer['run']>[0]['liveInvocation'];
    },
  ): AsyncIterable<SessionReplayEvent>;
  /**
   * Begin recording a tool cassette. The recorder is wired into the
   * agent runtime (`@graphorin/agent`) so each `tool.execute.end /
   * .error` event flows through.
   */
  recordToolCassette(opts: SessionRecordCassetteOptions): ToolCassetteRecorder;
  /** Recent audit rows for this session, newest-first. */
  audit(opts?: { readonly limit?: number }): Promise<ReadonlyArray<SessionAuditEntry>>;
}

/**
 * Options threaded into `Session.export({...})`.
 *
 * @stable
 */
export interface SessionExportOptions {
  readonly schema?: '1.0';
  readonly sink: SessionExportSink;
  readonly hash?: boolean;
  readonly writer?: string;
  readonly schemaUrl?: string;
  readonly includeAuditEntries?: boolean;
  readonly auditLimit?: number;
}

/**
 * Options accepted by `Session.recordToolCassette({...})`.
 *
 * @stable
 */
export interface SessionRecordCassetteOptions
  extends Omit<ToolCassetteRecorderOptions, 'sessionId' | 'runId' | 'writer'> {
  readonly runId: string;
  readonly writer?: string;
}

/**
 * Surface returned by {@link createSessionManager}.
 *
 * @stable
 */
export interface SessionManager {
  /** The underlying agent registry. */
  readonly agents: AgentRegistry;
  /** Default sanitizer instance (test seam). */
  readonly commentary: CommentarySanitizer;
  /**
   * Create a fresh session. The optional `commentaryPolicy` overrides
   * the manager-level default just for this session — useful for
   * deployments that pin a stricter posture per-conversation (e.g.
   * `'strip'` for compliance-sensitive sessions while everything else
   * uses the `'wrap'` default).
   */
  create(args: {
    readonly userId: string;
    readonly agentId: string;
    readonly sessionId?: string;
    readonly title?: string;
    readonly tags?: ReadonlyArray<string>;
    readonly commentaryPolicy?: CommentaryPolicy;
  }): Promise<Session>;
  /** Hydrate an existing session by id. */
  get(sessionId: string): Promise<Session>;
  /** Best-effort lookup. Returns `null` when the id is unknown. */
  find(sessionId: string): Promise<Session | null>;
  /** List sessions for a scope (newest-first by `createdAt`). */
  listSessions(
    scope: Pick<SessionScope, 'userId' | 'agentId'>,
  ): Promise<ReadonlyArray<SessionMetadata>>;
  /** Import a JSONL stream into a fresh session. */
  importFromString(
    body: string,
    opts?: SessionExportReadOptions,
  ): Promise<{ readonly read: SessionExportReadResult; readonly session: Session | null }>;
  /** Build the underlying replay engine for advanced consumers. */
  replayer(): SessionReplayer;
  /** Prune audit rows older than the supplied epoch ms. */
  pruneAudit(beforeEpochMs: number): Promise<number>;
}

/**
 * Build a session manager. The manager is the public entry point;
 * sessions are obtained via `manager.create(...)` / `manager.get(...)`.
 *
 * @stable
 */
export function createSessionManager(opts: CreateSessionManagerOptions): SessionManager {
  const store = opts.store;
  const memory = opts.memory;
  const counters = opts.counters ?? NOOP_COUNTERS;
  const commentary = createCommentarySanitizer({
    ...(opts.commentaryPolicy !== undefined ? { policy: opts.commentaryPolicy } : {}),
  });
  const now = opts.now ?? Date.now;
  const idFactory = opts.newId ?? newId;
  const agents = new AgentRegistry({ store, ...(opts.now !== undefined ? { now: opts.now } : {}) });
  const replayer = createSessionReplayer(opts.replay ?? {});

  function buildSession(
    meta: SessionMetadata,
    overrides: { readonly commentaryPolicy?: CommentaryPolicy } = {},
  ): Session {
    const scope: SessionScope = { userId: meta.userId, agentId: meta.agentId, sessionId: meta.id };
    const sessionCommentary =
      overrides.commentaryPolicy !== undefined && overrides.commentaryPolicy !== commentary.policy
        ? createCommentarySanitizer({ policy: overrides.commentaryPolicy })
        : commentary;
    return new SessionImpl({
      meta,
      scope,
      store,
      memory,
      counters,
      commentary: sessionCommentary,
      now,
      idFactory,
      agents,
      replayer,
      manager: () => manager,
    });
  }

  const manager: SessionManager = {
    agents,
    commentary,
    async create({ userId, agentId, sessionId, title, tags, commentaryPolicy }) {
      const id = sessionId ?? idFactory('sess');
      const createdAt = new Date(now()).toISOString();
      const metadata: SessionMetadata = {
        id,
        userId,
        agentId,
        ...(title !== undefined ? { title } : {}),
        createdAt,
        ...(tags !== undefined ? { tags } : {}),
      };
      await store.createSession(metadata);
      // Best-effort: register the primary agent if not yet registered.
      const existing = await store.resolveAgent(agentId);
      if (existing === null) {
        await agents.register(agentId, { displayName: agentId });
      }
      await store.appendAuditEntry({
        id: idFactory('aud'),
        sessionId: id,
        action: 'session.created',
        at: createdAt,
        actor: { kind: 'system', id: 'session-manager' },
        metadata: { userId, agentId },
      });
      return buildSession(metadata, {
        ...(commentaryPolicy !== undefined ? { commentaryPolicy } : {}),
      });
    },
    async get(sessionId) {
      const meta = await store.getSession(sessionId);
      if (meta === null) throw new SessionNotFoundError(sessionId);
      return buildSession(meta);
    },
    async find(sessionId) {
      const meta = await store.getSession(sessionId);
      if (meta === null) return null;
      return buildSession(meta);
    },
    async listSessions(scope) {
      return store.listSessions(scope);
    },
    async importFromString(body, importOpts) {
      const read = readSessionExport(body, importOpts ?? {});
      // The reader does not enforce ordering between record kinds. Buffer
      // session + agent records first so message imports always have a
      // resolved scope (userId / agentId pair) regardless of the writer's
      // emission order.
      type ParsedRecord = (typeof read.records)[number];
      const sessionScopes = new Map<string, { userId: string; agentId: string }>();
      let session: Session | null = null;
      const messageRecords: ParsedRecord[] = [];
      const handoffRecords: ParsedRecord[] = [];
      const auditRecords: ParsedRecord[] = [];
      for (const record of read.records) {
        if (record.kind === 'session') {
          await store.createSession({
            id: record.id,
            userId: record.userId,
            agentId: record.agentId,
            ...(record.title !== undefined ? { title: record.title } : {}),
            createdAt: record.createdAt,
            ...(record.updatedAt !== undefined ? { updatedAt: record.updatedAt } : {}),
            ...(record.closedAt !== undefined ? { closedAt: record.closedAt } : {}),
            ...(record.tags !== undefined ? { tags: record.tags } : {}),
          });
          sessionScopes.set(record.id, { userId: record.userId, agentId: record.agentId });
          const meta = await store.getSession(record.id);
          if (meta !== null) session = buildSession(meta);
        } else if (record.kind === 'agent') {
          await store.registerAgent({
            id: record.id,
            displayName: record.displayName,
            registeredAt: record.registeredAt,
            ...(record.retiredAt !== undefined ? { retiredAt: record.retiredAt } : {}),
            ...(record.tags !== undefined ? { tags: record.tags } : {}),
          });
        } else if (record.kind === 'message') {
          messageRecords.push(record);
        } else if (record.kind === 'handoff') {
          handoffRecords.push(record);
        } else if (record.kind === 'audit') {
          auditRecords.push(record);
        }
      }
      for (const record of messageRecords) {
        if (record.kind !== 'message') continue;
        const scope = sessionScopes.get(record.sessionId);
        if (scope === undefined) {
          // The exporter's invariant guarantees a session record exists
          // upstream of any message, but a forward-version writer that
          // changes ordering could still be lenient-parsed; skip the
          // orphan rather than wedging the import.
          continue;
        }
        await memory.push(
          { userId: scope.userId, agentId: scope.agentId, sessionId: record.sessionId },
          record.message,
        );
      }
      for (const record of handoffRecords) {
        if (record.kind !== 'handoff') continue;
        await store.appendHandoff(record.sessionId, {
          fromAgentId: record.fromAgentId,
          toAgentId: record.toAgentId,
          stepNumber: record.stepNumber,
          at: record.at,
          ...(record.reason !== undefined ? { reason: record.reason } : {}),
          ...(record.inputFilter !== undefined ? { inputFilter: record.inputFilter } : {}),
          ...(record.secretsInheritance !== undefined
            ? { secretsInheritance: record.secretsInheritance }
            : {}),
          ...(record.inheritedSecrets !== undefined
            ? { inheritedSecrets: record.inheritedSecrets }
            : {}),
          ...(record.secretsOverrideReason !== undefined
            ? { secretsOverrideReason: record.secretsOverrideReason }
            : {}),
        });
      }
      for (const record of auditRecords) {
        if (record.kind !== 'audit') continue;
        await store.appendAuditEntry({
          id: idFactory('aud'),
          sessionId: record.sessionId,
          action: record.action,
          at: record.at,
          ...(record.actor !== undefined ? { actor: record.actor } : {}),
          ...(record.metadata !== undefined ? { metadata: record.metadata } : {}),
        });
      }
      return { read, session };
    },
    replayer() {
      return replayer;
    },
    async pruneAudit(beforeEpochMs) {
      return store.pruneAuditEntries(beforeEpochMs);
    },
  };
  return manager;
}

interface SessionImplArgs {
  readonly meta: SessionMetadata;
  readonly scope: SessionScope;
  readonly store: SessionStoreExt;
  readonly memory: SessionMemoryFacade;
  readonly counters: SessionCounters;
  readonly commentary: CommentarySanitizer;
  readonly now: () => number;
  readonly idFactory: (prefix: string) => string;
  readonly agents: AgentRegistry;
  readonly replayer: SessionReplayer;
  readonly manager: () => SessionManager;
}

class SessionImpl implements Session {
  readonly id: string;
  readonly scope: SessionScope;
  readonly commentaryPolicy: CommentaryPolicy;
  readonly #args: SessionImplArgs;

  constructor(args: SessionImplArgs) {
    this.#args = args;
    this.id = args.meta.id;
    this.scope = args.scope;
    this.commentaryPolicy = args.commentary.policy;
  }

  async metadata(): Promise<SessionMetadata> {
    const meta = await this.#args.store.getSession(this.id);
    if (meta === null) throw new SessionNotFoundError(this.id);
    return meta;
  }

  async push(message: Message): Promise<MessageRef> {
    const sanitized = this.#sanitize(message, 'session-push');
    return this.#args.memory.push(this.scope, sanitized);
  }

  async list(opts: SessionListOptions = {}): Promise<ReadonlyArray<Message>> {
    const out = await this.#args.memory.list(this.scope, opts);
    if (out.length === 0) return out;
    return out.map((m) => this.#sanitize(m, 'session-list'));
  }

  async search(
    query: string,
    opts: { topK?: number; signal?: AbortSignal } = {},
  ): Promise<ReadonlyArray<MemoryHit>> {
    return this.#args.memory.search(this.scope, query, opts);
  }

  async compact(
    opts: { keepLastN?: number } = {},
  ): Promise<{ readonly removed: number; readonly summarized: number; readonly summary?: string }> {
    if (this.#args.memory.compact === undefined) {
      return { removed: 0, summarized: 0 };
    }
    return this.#args.memory.compact(this.scope, opts);
  }

  async appendHandoff(record: Omit<HandoffRecord, 'at'> & { at?: string }): Promise<HandoffRecord> {
    const at = record.at ?? new Date(this.#args.now()).toISOString();
    const full: HandoffRecord = { ...record, at };
    await this.#args.store.appendHandoff(this.id, full);
    await this.#audit('session.handoff.appended', {
      fromAgentId: full.fromAgentId,
      toAgentId: full.toAgentId,
      stepNumber: full.stepNumber,
    });
    return full;
  }

  async listHandoffs(): Promise<ReadonlyArray<HandoffRecord>> {
    return this.#args.store.listHandoffs(this.id);
  }

  async handoffsByAgent(
    agentId: string,
    direction: 'from' | 'to' | 'both' = 'both',
  ): Promise<ReadonlyArray<HandoffRecord>> {
    const all = await this.#args.store.listHandoffs(this.id);
    return all.filter((h) => {
      if (direction === 'from') return h.fromAgentId === agentId;
      if (direction === 'to') return h.toAgentId === agentId;
      return h.fromAgentId === agentId || h.toAgentId === agentId;
    });
  }

  async attachWorkflowRun(
    run: Omit<SessionWorkflowRun, 'sessionId' | 'attachedAt'> & { readonly attachedAt?: string },
  ): Promise<SessionWorkflowRun> {
    const attachedAt = run.attachedAt ?? new Date(this.#args.now()).toISOString();
    const full: SessionWorkflowRun = {
      sessionId: this.id,
      workflowId: run.workflowId,
      threadId: run.threadId,
      status: run.status,
      attachedAt,
    };
    await this.#args.store.attachWorkflowRun(full);
    return full;
  }

  async workflowRuns(): Promise<ReadonlyArray<SessionWorkflowRun>> {
    return this.#args.store.listWorkflowRuns(this.id);
  }

  async updateWorkflowRunStatus(
    workflowId: string,
    threadId: string,
    status: SessionWorkflowRun['status'],
  ): Promise<void> {
    await this.#args.store.updateWorkflowRunStatus(this.id, workflowId, threadId, status);
  }

  async close(): Promise<void> {
    const closedAt = new Date(this.#args.now()).toISOString();
    await this.#args.store.closeSession(this.id, closedAt);
    await this.#audit('session.closed', { closedAt });
  }

  async fork(opts: { readonly title?: string } = {}): Promise<Session> {
    const meta = await this.metadata();
    const newSession = await this.#args.manager().create({
      userId: meta.userId,
      agentId: meta.agentId,
      ...(opts.title !== undefined
        ? { title: opts.title }
        : meta.title !== undefined
          ? { title: meta.title }
          : {}),
      ...(meta.tags !== undefined ? { tags: meta.tags } : {}),
    });
    await this.#args.store.appendAuditEntry({
      id: this.#args.idFactory('aud'),
      sessionId: this.id,
      action: 'session.forked',
      at: new Date(this.#args.now()).toISOString(),
      actor: { kind: 'system', id: 'session-manager' },
      metadata: { forkedSessionId: newSession.id },
    });
    return newSession;
  }

  async export(opts: SessionExportOptions): Promise<SessionExportFooterRecord> {
    const meta = await this.metadata();
    const writerOpts: SessionExportWriterOptions = {
      writer: opts.writer ?? `@graphorin/sessions@0.3.0`,
      ...(opts.schemaUrl !== undefined ? { schemaUrl: opts.schemaUrl } : {}),
      ...(opts.hash !== undefined ? { hash: opts.hash } : {}),
    };
    const writer: SessionExportWriter = createSessionExportWriter(opts.sink, writerOpts);
    const sessionRecord: SessionExportSessionRecord = {
      kind: 'session',
      id: meta.id,
      userId: meta.userId,
      agentId: meta.agentId,
      ...(meta.title !== undefined ? { title: meta.title } : {}),
      ...(meta.tags !== undefined ? { tags: meta.tags } : {}),
      createdAt: meta.createdAt,
      ...(meta.updatedAt !== undefined ? { updatedAt: meta.updatedAt } : {}),
      ...(meta.closedAt !== undefined ? { closedAt: meta.closedAt } : {}),
    };
    await writer.writeRecord(sessionRecord);

    const allAgents = await this.#args.store.listAgents();
    for (const agent of allAgents) {
      const agentRecord: SessionExportAgentRecord = agentToRecord(agent);
      await writer.writeRecord(agentRecord);
    }

    const messages = await this.#args.memory.list(this.scope, {});
    let sequence = 0;
    for (const message of messages) {
      sequence += 1;
      const sanitized = this.#sanitize(message, 'session-export');
      const messageRecord: SessionExportMessageRecord = {
        kind: 'message',
        sessionId: this.id,
        messageId: this.#args.idFactory('msg'),
        sequence,
        createdAt: new Date(this.#args.now()).toISOString(),
        message: sanitized,
      };
      await writer.writeRecord(messageRecord);
    }

    const handoffs = await this.#args.store.listHandoffs(this.id);
    for (const handoff of handoffs) {
      const handoffRecord: SessionExportHandoffRecord = {
        kind: 'handoff',
        sessionId: this.id,
        fromAgentId: handoff.fromAgentId,
        toAgentId: handoff.toAgentId,
        stepNumber: handoff.stepNumber,
        at: handoff.at,
        ...(handoff.reason !== undefined ? { reason: handoff.reason } : {}),
        ...(handoff.inputFilter !== undefined ? { inputFilter: handoff.inputFilter } : {}),
        ...(handoff.secretsInheritance !== undefined
          ? { secretsInheritance: handoff.secretsInheritance }
          : {}),
        ...(handoff.inheritedSecrets !== undefined
          ? { inheritedSecrets: handoff.inheritedSecrets }
          : {}),
        ...(handoff.secretsOverrideReason !== undefined
          ? { secretsOverrideReason: handoff.secretsOverrideReason }
          : {}),
      };
      await writer.writeRecord(handoffRecord);
    }

    if (opts.includeAuditEntries === true) {
      const audits = await this.#args.store.listAuditEntries(this.id, {
        limit: opts.auditLimit ?? 100,
      });
      for (const entry of audits) {
        const auditRecord: SessionExportAuditRecord = {
          kind: 'audit',
          sessionId: entry.sessionId,
          action: entry.action,
          at: entry.at,
          ...(entry.actor !== undefined ? { actor: entry.actor } : {}),
          ...(entry.metadata !== undefined ? { metadata: entry.metadata } : {}),
        };
        await writer.writeRecord(auditRecord);
      }
    }

    return writer.close();
  }

  async *replay(
    opts: SessionReplayOptions & {
      readonly traceSource?: Parameters<SessionReplayer['run']>[0]['traceSource'];
      readonly liveInvocation?: Parameters<SessionReplayer['run']>[0]['liveInvocation'];
    } = {},
  ): AsyncIterable<SessionReplayEvent> {
    const target = `session:${this.id}`;
    await this.#audit('session.replay.requested', {
      raw: opts.raw ?? false,
      ...(opts.fromMessageId !== undefined ? { fromMessageId: opts.fromMessageId } : {}),
      ...(opts.cassette !== undefined ? { cassetteKind: opts.cassette.kind } : {}),
    });
    let count = 0;
    const runArgs: Parameters<SessionReplayer['run']>[0] = {
      target,
      ...(opts.raw !== undefined ? { raw: opts.raw } : {}),
      ...(opts.fromMessageId !== undefined ? { fromMessageId: opts.fromMessageId } : {}),
      ...(opts.minSensitivity !== undefined ? { minSensitivity: opts.minSensitivity } : {}),
      ...(opts.actor !== undefined ? { actor: opts.actor } : {}),
      ...(opts.cassette !== undefined ? { cassette: opts.cassette } : {}),
      ...(opts.toolReplayMode !== undefined ? { toolReplayMode: opts.toolReplayMode } : {}),
      ...(opts.perToolMode !== undefined ? { perToolMode: opts.perToolMode } : {}),
      ...(opts.failOnIdempotencyMismatch !== undefined
        ? { failOnIdempotencyMismatch: opts.failOnIdempotencyMismatch }
        : {}),
      ...(opts.failOnSchemaMismatch !== undefined
        ? { failOnSchemaMismatch: opts.failOnSchemaMismatch }
        : {}),
      ...(opts.onMissingArtifact !== undefined
        ? { onMissingArtifact: opts.onMissingArtifact }
        : {}),
      ...(opts.traceSource !== undefined ? { traceSource: opts.traceSource } : {}),
      ...(opts.liveInvocation !== undefined ? { liveInvocation: opts.liveInvocation } : {}),
    };
    for await (const event of this.#args.replayer.run(runArgs)) {
      count += 1;
      yield event;
    }
    await this.#audit('session.replay.completed', { eventCount: count });
  }

  recordToolCassette(opts: SessionRecordCassetteOptions): ToolCassetteRecorder {
    const recorderOpts: ToolCassetteRecorderOptions = {
      ...opts,
      sessionId: this.id,
      writer: opts.writer ?? `@graphorin/sessions@0.3.0`,
    };
    return createToolCassetteRecorder(recorderOpts);
  }

  async audit(opts: { readonly limit?: number } = {}): Promise<ReadonlyArray<SessionAuditEntry>> {
    return this.#args.store.listAuditEntries(this.id, opts);
  }

  // ----- internals ----- //

  #sanitize(message: Message, boundary: CommentaryBoundary): Message {
    const out = this.#args.commentary.sanitizeMessage(message, boundary);
    for (const decision of out.decisions) {
      this.#emitCommentary(boundary, decision);
    }
    return out.message;
  }

  #emitCommentary(boundary: CommentaryBoundary, decision: CommentarySanitizationDecision): void {
    if (!decision.applied) return;
    this.#args.counters.inc('commentary.sanitization.applied.total', 1, {
      boundary,
      policy: decision.policy,
      ...(decision.reasons.length > 0 ? { reason: decision.reasons[0] ?? 'unknown' } : {}),
    });
    void this.#args.store
      .appendAuditEntry({
        id: this.#args.idFactory('aud'),
        sessionId: this.id,
        action: 'session.commentary.sanitized',
        at: new Date(this.#args.now()).toISOString(),
        actor: { kind: 'system', id: 'session-sanitizer' },
        metadata: {
          boundary,
          policy: decision.policy,
          reasons: decision.reasons,
          sha256OfBefore: decision.sha256OfBefore,
          sha256OfAfter: decision.sha256OfAfter,
        },
      })
      .catch(() => {
        // Audit-log failures must not break the session hot path. The
        // operator surfaces persistent failures via metric drift.
      });
  }

  async #audit(action: string, metadata?: Readonly<Record<string, unknown>>): Promise<void> {
    try {
      await this.#args.store.appendAuditEntry({
        id: this.#args.idFactory('aud'),
        sessionId: this.id,
        action,
        at: new Date(this.#args.now()).toISOString(),
        actor: { kind: 'system', id: 'session-manager' },
        ...(metadata !== undefined ? { metadata } : {}),
      });
    } catch {
      // best-effort.
    }
  }
}

function agentToRecord(agent: AgentRegistryEntry): SessionExportAgentRecord {
  return {
    kind: 'agent',
    id: agent.id,
    displayName: agent.displayName,
    registeredAt: agent.registeredAt,
    ...(agent.retiredAt !== undefined ? { retiredAt: agent.retiredAt } : {}),
    ...(agent.tags !== undefined ? { tags: agent.tags } : {}),
  };
}

// Help the type system: re-export the Message variants for downstream
// imports without dragging the full @graphorin/core types in.
export type { AssistantMessage, MessageContent, SystemMessage, ToolMessage, UserMessage };
