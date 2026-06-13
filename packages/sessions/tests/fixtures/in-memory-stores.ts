/**
 * Lightweight in-memory `SessionStoreExt` + `SessionMemoryFacade`
 * fixtures for the sessions test suite. The shapes mirror the
 * production `@graphorin/store-sqlite` + `@graphorin/memory` adapters
 * but stay dependency-free so the unit tests can run without a SQLite
 * binary.
 */

import type { HandoffRecord, MemoryHit, Message, MessageRef, SessionScope } from '@graphorin/core';
import type {
  AgentRegistryEntry,
  SessionAuditEntry,
  SessionListOptions,
  SessionMetadata,
  SessionStoreExt,
  SessionWorkflowRun,
} from '@graphorin/core/contracts';
import type { SessionMemoryFacade, SessionMessageWithMetadata } from '../../src/facade.js';

export class InMemorySessionStore implements SessionStoreExt {
  readonly sessions = new Map<string, SessionMetadata>();
  readonly agents = new Map<string, AgentRegistryEntry>();
  readonly handoffs = new Map<string, HandoffRecord[]>();
  readonly workflowRuns = new Map<string, SessionWorkflowRun[]>();
  readonly auditEntries: SessionAuditEntry[] = [];

  async createSession(metadata: SessionMetadata): Promise<void> {
    this.sessions.set(metadata.id, metadata);
  }
  async getSession(sessionId: string): Promise<SessionMetadata | null> {
    return this.sessions.get(sessionId) ?? null;
  }
  async listSessions(scope: {
    userId: string;
    agentId?: string;
  }): Promise<ReadonlyArray<SessionMetadata>> {
    return [...this.sessions.values()].filter(
      (s) =>
        s.userId === scope.userId && (scope.agentId === undefined || s.agentId === scope.agentId),
    );
  }
  async updateSession(sessionId: string, patch: Partial<SessionMetadata>): Promise<void> {
    const cur = this.sessions.get(sessionId);
    if (cur === undefined) return;
    this.sessions.set(sessionId, { ...cur, ...patch });
  }
  async closeSession(sessionId: string, closedAt: string): Promise<void> {
    const cur = this.sessions.get(sessionId);
    if (cur === undefined) return;
    this.sessions.set(sessionId, { ...cur, closedAt });
  }
  async registerAgent(entry: AgentRegistryEntry): Promise<void> {
    this.agents.set(entry.id, entry);
  }
  async retireAgent(agentId: string, retiredAt: string): Promise<void> {
    const cur = this.agents.get(agentId);
    if (cur === undefined) return;
    this.agents.set(agentId, { ...cur, retiredAt });
  }
  async deleteAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
  }
  async resolveAgent(agentId: string): Promise<AgentRegistryEntry | null> {
    return this.agents.get(agentId) ?? null;
  }
  async listAgents(): Promise<ReadonlyArray<AgentRegistryEntry>> {
    return [...this.agents.values()].sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
  }
  async appendHandoff(sessionId: string, record: HandoffRecord): Promise<void> {
    const list = this.handoffs.get(sessionId) ?? [];
    list.push(record);
    this.handoffs.set(sessionId, list);
  }
  async listHandoffs(sessionId: string): Promise<ReadonlyArray<HandoffRecord>> {
    return [...(this.handoffs.get(sessionId) ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  }
  async attachWorkflowRun(run: SessionWorkflowRun): Promise<void> {
    const list = this.workflowRuns.get(run.sessionId) ?? [];
    const idx = list.findIndex(
      (r) => r.workflowId === run.workflowId && r.threadId === run.threadId,
    );
    if (idx >= 0) list[idx] = run;
    else list.push(run);
    this.workflowRuns.set(run.sessionId, list);
  }
  async updateWorkflowRunStatus(
    sessionId: string,
    workflowId: string,
    threadId: string,
    status: SessionWorkflowRun['status'],
  ): Promise<void> {
    const list = this.workflowRuns.get(sessionId) ?? [];
    const idx = list.findIndex((r) => r.workflowId === workflowId && r.threadId === threadId);
    if (idx >= 0) {
      const cur = list[idx];
      if (cur !== undefined) {
        list[idx] = { ...cur, status };
      }
    }
  }
  async listWorkflowRuns(sessionId: string): Promise<ReadonlyArray<SessionWorkflowRun>> {
    return [...(this.workflowRuns.get(sessionId) ?? [])];
  }
  async appendAuditEntry(entry: SessionAuditEntry): Promise<void> {
    this.auditEntries.push(entry);
  }
  async listAuditEntries(
    sessionId: string,
    opts: { limit?: number } = {},
  ): Promise<ReadonlyArray<SessionAuditEntry>> {
    const limit = opts.limit ?? 100;
    return this.auditEntries
      .filter((e) => e.sessionId === sessionId)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit);
  }
  async pruneAuditEntries(beforeEpochMs: number): Promise<number> {
    const before = this.auditEntries.length;
    const remaining = this.auditEntries.filter((e) => Date.parse(e.at) >= beforeEpochMs);
    this.auditEntries.length = 0;
    this.auditEntries.push(...remaining);
    return before - this.auditEntries.length;
  }
}

interface StoredMessage {
  readonly scope: SessionScope;
  readonly message: Message;
  readonly id: string;
  readonly sequence: number;
  readonly createdAt: string;
}

export class InMemoryMemorySessionFacade implements SessionMemoryFacade {
  readonly messages: StoredMessage[] = [];
  #seq = 0;
  #now: () => number;

  constructor(now: () => number = () => Date.now()) {
    this.#now = now;
  }

  async push(scope: SessionScope, message: Message): Promise<MessageRef> {
    this.#seq += 1;
    const ref: MessageRef = {
      messageId: `msg-${this.#seq}`,
      sequence: this.#seq,
      persistedAt: new Date(this.#now()).toISOString(),
    };
    this.messages.push({
      scope,
      message,
      id: ref.messageId,
      sequence: ref.sequence,
      createdAt: ref.persistedAt,
    });
    return ref;
  }
  async list(scope: SessionScope, opts: SessionListOptions = {}): Promise<ReadonlyArray<Message>> {
    let rows = this.messages.filter(
      (m) => m.scope.sessionId === scope.sessionId && m.scope.userId === scope.userId,
    );
    if (opts.agentId !== undefined) {
      rows = rows.filter(
        (m) => m.message.role === 'assistant' && m.message.agentId === opts.agentId,
      );
    }
    if (opts.role !== undefined) {
      rows = rows.filter((m) => m.message.role === opts.role);
    }
    if (opts.sinceMessageId !== undefined) {
      const idx = rows.findIndex((m) => m.id === opts.sinceMessageId);
      if (idx >= 0) rows = rows.slice(idx + 1);
    }
    if (opts.lastN !== undefined) {
      rows = rows.slice(-opts.lastN);
    }
    return rows.map((r) => r.message);
  }
  async listWithMetadata(
    scope: SessionScope,
    opts: SessionListOptions = {},
  ): Promise<ReadonlyArray<SessionMessageWithMetadata>> {
    const messages = await this.list(scope, opts);
    return messages.map((message) => {
      const row = this.messages.find((m) => m.message === message);
      return {
        message,
        messageId: row?.id ?? '',
        sequence: row?.sequence ?? 0,
        createdAt: row?.createdAt ?? '',
      };
    });
  }
  async search(): Promise<ReadonlyArray<MemoryHit>> {
    return [];
  }
}
