import type {
  Block,
  EmbedderProvider,
  Episode,
  Fact,
  Insight,
  MemoryHit,
  Message,
  MessageRef,
  Rule,
  SessionScope,
} from '@graphorin/core';
import type {
  ConflictAuditDecision,
  ConflictAuditInputLike,
  ConflictMemoryStoreExt,
  ConsolidatorMemoryStoreExt,
  ConsolidatorRunFinish,
  ConsolidatorRunInput,
  ConsolidatorStatePatch,
  ConsolidatorStateRow,
  DlqBatchInput,
  DlqBatchRow,
  EmbeddedWriteOptions,
  EmbeddingMetaRegistryLike,
  InsightListOptions,
  InsightMemoryStoreExt,
  InsightSearchStoreOptions,
  MemoryStoreAdapter,
  PendingConflictInputLike,
  PendingConflictRowLike,
  SessionMessageRecord,
} from '../../src/internal/storage-adapter.js';

interface RegisteredEmbedder {
  readonly id: string;
  readonly embedderKind: string;
  readonly model: string;
  readonly dim: number;
  readonly distanceMetric: 'cosine' | 'dot' | 'euclidean';
  readonly configHash: string;
  retiredAt: number | null;
}

/**
 * Tiny in-memory `EmbeddingMetaRegistryLike` used by the test suite.
 * Mirrors the shape of `@graphorin/store-sqlite`'s
 * `EmbeddingMetaRepository` without the SQL layer.
 */
export class InMemoryEmbeddingRegistry implements EmbeddingMetaRegistryLike {
  readonly #rows: Map<string, RegisteredEmbedder> = new Map();
  readonly policy: 'lock-on-first' | 'multi-active' | 'auto-migrate';

  constructor(policy: 'lock-on-first' | 'multi-active' | 'auto-migrate' = 'multi-active') {
    this.policy = policy;
  }

  registerOrReturn(input: {
    id: string;
    embedderKind: string;
    model: string;
    dim: number;
    distanceMetric?: 'cosine' | 'dot' | 'euclidean';
    configHash: string;
    notes?: string | null;
  }): { readonly id: string } {
    const existing = this.#rows.get(input.id);
    if (existing !== undefined) return { id: input.id };
    if (this.policy === 'lock-on-first') {
      const active = [...this.#rows.values()].filter((r) => r.retiredAt === null);
      if (active.length > 0 && active.every((r) => r.id !== input.id)) {
        throw new Error(
          `[in-memory-store] lock-on-first: cannot register '${input.id}' alongside '${active[0]?.id}'.`,
        );
      }
    }
    this.#rows.set(input.id, {
      id: input.id,
      embedderKind: input.embedderKind,
      model: input.model,
      dim: input.dim,
      distanceMetric: input.distanceMetric ?? 'cosine',
      configHash: input.configHash,
      retiredAt: null,
    });
    return { id: input.id };
  }

  get(id: string): unknown | null {
    return this.#rows.get(id) ?? null;
  }

  assertKnown(id: string): void {
    if (!this.#rows.has(id)) {
      throw new Error(`[in-memory-store] unknown embedder '${id}'`);
    }
  }

  retire(id: string, retiredAt: number = Date.now()): void {
    const existing = this.#rows.get(id);
    if (existing !== undefined) existing.retiredAt = retiredAt;
  }

  listAll(): ReadonlyArray<{ id: string; retiredAt: number | null }> {
    return [...this.#rows.values()].map((r) => ({ id: r.id, retiredAt: r.retiredAt }));
  }

  listActive(): ReadonlyArray<{ id: string; retiredAt: number | null }> {
    return this.listAll().filter((r) => r.retiredAt === null);
  }
}

/**
 * Hook the test suite uses to populate the token-cache against the
 * in-memory fixture. Mirrors the per-message `token_count` cache
 * column added in DEC-131.
 */
export interface InMemoryStoreTestHooks {
  setTokenCount(messageId: string, tokenCount: number | null): void;
  registerFactEmbedder(factId: string, embedderId: string): void;
  /** Stamp a custom strength + last-accessed pair for decay tests. */
  setDecaySignals(
    factId: string,
    signals: { strength?: number; lastAccessedAt?: number; createdAt?: number; archived?: boolean },
  ): void;
}

/**
 * Bookkeeping returned alongside the in-memory store so the conflict
 * pipeline tests can read every audit row and pending queue entry
 * deterministically.
 */
export interface InMemoryConflictHooks {
  audit: ReadonlyArray<ConflictAuditInputLike>;
  pending: ReadonlyArray<PendingConflictInputLike>;
}

/**
 * Bookkeeping returned alongside the in-memory store so the
 * consolidator tests can read every persisted run + DLQ row
 * deterministically.
 */
export interface InMemoryConsolidatorHooks {
  state: ReadonlyMap<string, ConsolidatorStateRow>;
  runs: ReadonlyArray<ConsolidatorRunInput & { finish?: ConsolidatorRunFinish }>;
  dlq: ReadonlyArray<DlqBatchRow>;
}

class InMemoryConsolidatorStore implements ConsolidatorMemoryStoreExt {
  readonly state = new Map<string, ConsolidatorStateRow>();
  readonly runs: Array<ConsolidatorRunInput & { finish?: ConsolidatorRunFinish }> = [];
  readonly dlq = new Map<string, DlqBatchRow>();

  static scopeKey(scope: SessionScope): string {
    return `${scope.userId}|${scope.sessionId ?? ''}|${scope.agentId ?? ''}`;
  }

  async getState(scope: SessionScope): Promise<ConsolidatorStateRow | null> {
    return this.state.get(InMemoryConsolidatorStore.scopeKey(scope)) ?? null;
  }

  async upsertState(
    scope: SessionScope,
    patch: ConsolidatorStatePatch,
  ): Promise<ConsolidatorStateRow> {
    const key = InMemoryConsolidatorStore.scopeKey(scope);
    const current: ConsolidatorStateRow = this.state.get(key) ?? {
      scope,
      lastProcessedMessageId: null,
      lastPhase: null,
      lastCompletedAt: null,
      nextEligibleAt: null,
      activeLockHeldBy: null,
      activeLockAcquiredAt: null,
    };
    const next: ConsolidatorStateRow = {
      ...current,
      scope,
      ...(patch.lastProcessedMessageId !== undefined
        ? { lastProcessedMessageId: patch.lastProcessedMessageId }
        : {}),
      ...(patch.lastPhase !== undefined ? { lastPhase: patch.lastPhase } : {}),
      ...(patch.lastCompletedAt !== undefined ? { lastCompletedAt: patch.lastCompletedAt } : {}),
      ...(patch.nextEligibleAt !== undefined ? { nextEligibleAt: patch.nextEligibleAt } : {}),
      ...(patch.activeLockHeldBy !== undefined ? { activeLockHeldBy: patch.activeLockHeldBy } : {}),
      ...(patch.activeLockAcquiredAt !== undefined
        ? { activeLockAcquiredAt: patch.activeLockAcquiredAt }
        : {}),
    };
    this.state.set(key, next);
    return next;
  }

  async acquireLock(
    scope: SessionScope,
    runId: string,
    now: number,
    maxAgeMs: number,
  ): Promise<boolean> {
    const key = InMemoryConsolidatorStore.scopeKey(scope);
    const current = this.state.get(key);
    if (current === undefined || current.activeLockHeldBy === null) {
      this.state.set(key, {
        ...(current ?? {
          scope,
          lastProcessedMessageId: null,
          lastPhase: null,
          lastCompletedAt: null,
          nextEligibleAt: null,
        }),
        scope,
        activeLockHeldBy: runId,
        activeLockAcquiredAt: now,
      } as ConsolidatorStateRow);
      return true;
    }
    if (current.activeLockHeldBy === runId) return true;
    if (
      maxAgeMs > 0 &&
      current.activeLockAcquiredAt !== null &&
      now - current.activeLockAcquiredAt > maxAgeMs
    ) {
      this.state.set(key, {
        ...current,
        activeLockHeldBy: runId,
        activeLockAcquiredAt: now,
      });
      return true;
    }
    return false;
  }

  async releaseLock(scope: SessionScope, runId: string): Promise<void> {
    const key = InMemoryConsolidatorStore.scopeKey(scope);
    const current = this.state.get(key);
    if (current !== undefined && current.activeLockHeldBy === runId) {
      this.state.set(key, {
        ...current,
        activeLockHeldBy: null,
        activeLockAcquiredAt: null,
      });
    }
  }

  async recordRunStart(input: ConsolidatorRunInput): Promise<void> {
    this.runs.push({ ...input });
  }

  async recordRunFinish(finish: ConsolidatorRunFinish): Promise<void> {
    const run = this.runs.find((r) => r.id === finish.id);
    if (run !== undefined)
      (run as ConsolidatorRunInput & { finish?: ConsolidatorRunFinish }).finish = finish;
  }

  async listRecentRuns(_scope: SessionScope, limit = 50) {
    return this.runs
      .slice()
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        phase: r.phase,
        status: r.finish?.status ?? 'running',
        startedAt: r.startedAt,
        finishedAt: r.finish?.finishedAt ?? null,
        llmCostUsd: r.finish?.llmCostUsd ?? null,
        llmTokensUsed: r.finish?.llmTokensUsed ?? 0,
        factsCreated: r.finish?.factsCreated ?? 0,
        factsUpdated: r.finish?.factsUpdated ?? 0,
      }));
  }

  async enqueueFailedBatch(input: DlqBatchInput): Promise<void> {
    this.dlq.set(input.id, {
      id: input.id,
      consolidatorRunId: input.consolidatorRunId,
      scope: input.scope,
      messageIds: [...input.messageIds],
      errorKind: input.errorKind,
      errorMessage: input.errorMessage,
      failedAt: input.failedAt,
      nextRetryAt: input.nextRetryAt,
      retryCount: input.retryCount,
    });
  }

  async claimReadyBatches(
    scope: SessionScope,
    now: number,
    limit = 50,
  ): Promise<ReadonlyArray<DlqBatchRow>> {
    const out: DlqBatchRow[] = [];
    for (const row of this.dlq.values()) {
      if (row.scope.userId !== scope.userId) continue;
      if (row.nextRetryAt !== null && row.nextRetryAt <= now) {
        out.push(row);
        if (out.length >= limit) break;
      }
    }
    return out;
  }

  async markBatchSucceeded(id: string): Promise<void> {
    this.dlq.delete(id);
  }

  async rescheduleBatch(id: string, retryCount: number, nextRetryAt: number): Promise<void> {
    const row = this.dlq.get(id);
    if (row !== undefined) {
      this.dlq.set(id, { ...row, retryCount, nextRetryAt });
    }
  }

  async markBatchExhausted(id: string, errorMessage: string, retryCount?: number): Promise<void> {
    const row = this.dlq.get(id);
    if (row !== undefined) {
      this.dlq.set(id, {
        ...row,
        errorMessage,
        nextRetryAt: null,
        ...(retryCount !== undefined ? { retryCount } : {}),
      });
    }
  }

  async listFailedBatches(scope: SessionScope, limit = 100): Promise<ReadonlyArray<DlqBatchRow>> {
    const out: DlqBatchRow[] = [];
    for (const row of this.dlq.values()) {
      if (row.scope.userId === scope.userId) out.push(row);
      if (out.length >= limit) break;
    }
    return out;
  }
}

class InMemoryConflictStore implements ConflictMemoryStoreExt {
  readonly audit: ConflictAuditInputLike[] = [];
  readonly pending: Array<{
    readonly id: number;
    readonly input: PendingConflictInputLike;
    resolvedAt: number | null;
    decision: ConflictAuditDecision | null;
  }> = [];
  #seq = 0;

  async recordDecision(
    input: ConflictAuditInputLike,
  ): Promise<{ readonly id: number; readonly detectedAt: number }> {
    this.audit.push(input);
    this.#seq += 1;
    return { id: this.#seq, detectedAt: Date.now() };
  }

  async enqueuePending(input: PendingConflictInputLike): Promise<{ readonly id: number }> {
    this.#seq += 1;
    const id = this.#seq;
    this.pending.push({ id, input, resolvedAt: null, decision: null });
    return { id };
  }

  async listPending(
    scope: SessionScope,
    limit = 50,
  ): Promise<ReadonlyArray<PendingConflictRowLike>> {
    const now = Date.now();
    return this.pending
      .filter((p) => p.input.scope.userId === scope.userId && p.resolvedAt === null)
      .map(
        (p): PendingConflictRowLike => ({
          id: p.id,
          scopeUserId: p.input.scope.userId,
          factId: p.input.factId,
          candidateText: p.input.candidateText,
          stage: p.input.stage,
          reason: p.input.reason ?? null,
          enqueuedAt: now,
          attemptedAt: null,
          resolvedAt: p.resolvedAt,
          decision: p.decision,
          conflictingIds: p.input.conflictingIds ?? [],
        }),
      )
      .slice(0, limit);
  }

  async markResolved(id: number, decision: ConflictAuditDecision): Promise<void> {
    const entry = this.pending.find((p) => p.id === id);
    if (entry !== undefined) {
      entry.resolvedAt = Date.now();
      entry.decision = decision;
    }
  }

  /** Test helper — exposes the raw pending input list for assertions. */
  rawPending(): ReadonlyArray<PendingConflictInputLike> {
    return this.pending.map((p) => p.input);
  }
}

class InMemoryInsightStore implements InsightMemoryStoreExt {
  readonly rows: Insight[] = [];

  async insert(insight: Insight): Promise<void> {
    const idx = this.rows.findIndex((r) => r.id === insight.id);
    if (idx >= 0) this.rows[idx] = insight;
    else this.rows.push(insight);
  }

  async list(scope: SessionScope, opts: InsightListOptions = {}): Promise<ReadonlyArray<Insight>> {
    const limit = opts.limit ?? 50;
    return this.rows
      .filter(
        (i) =>
          i.userId === scope.userId &&
          i.deletedAt === undefined &&
          (opts.includeQuarantined === true || i.status !== 'quarantined'),
      )
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, limit);
  }

  async search(
    scope: SessionScope,
    query: string,
    opts: InsightSearchStoreOptions = {},
  ): Promise<ReadonlyArray<MemoryHit<Insight>>> {
    const topK = opts.topK ?? 10;
    const q = query.toLowerCase();
    const out: MemoryHit<Insight>[] = [];
    for (const i of this.rows) {
      if (i.userId !== scope.userId) continue;
      if (i.deletedAt !== undefined) continue;
      if (opts.includeQuarantined !== true && i.status === 'quarantined') continue;
      if (q === '*' || i.text.toLowerCase().includes(q)) {
        out.push({ record: i, score: 1, signals: { bm25: 1 } });
      }
      if (out.length >= topK) break;
    }
    return out;
  }

  async get(id: string): Promise<Insight | null> {
    const i = this.rows.find((r) => r.id === id);
    if (i === undefined || i.deletedAt !== undefined) return null;
    return i;
  }

  async bumpSalience(id: string, delta: number): Promise<void> {
    const idx = this.rows.findIndex((r) => r.id === id);
    const i = idx >= 0 ? this.rows[idx] : undefined;
    if (i !== undefined) {
      this.rows[idx] = {
        ...i,
        salience: Math.max(0, i.salience + delta),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async prune(scope: SessionScope): Promise<number> {
    let pruned = 0;
    for (let idx = 0; idx < this.rows.length; idx++) {
      const i = this.rows[idx];
      if (
        i !== undefined &&
        i.userId === scope.userId &&
        i.salience <= 0 &&
        i.deletedAt === undefined
      ) {
        this.rows[idx] = { ...i, deletedAt: new Date().toISOString() };
        pruned += 1;
      }
    }
    return pruned;
  }
}

/**
 * In-memory `MemoryStoreAdapter` used by the unit tests. Implements
 * just enough surface to exercise the facade + the six tier sub-
 * modules deterministically without a SQLite native build.
 *
 * The returned adapter carries a `__hooks` property the test suite
 * uses to reach the cache-population helpers.
 */
export function createInMemoryStore(
  options: {
    embedderId?: string;
    withConflictStore?: boolean;
    withConsolidatorStore?: boolean;
    withInsightStore?: boolean;
  } = {},
): MemoryStoreAdapter & {
  readonly __hooks: InMemoryStoreTestHooks;
  readonly __conflicts: InMemoryConflictHooks | null;
  readonly __consolidator: InMemoryConsolidatorHooks | null;
  readonly __insights: ReadonlyArray<Insight> | null;
} {
  const blocks = new Map<string, Block>();
  const messages: Message[] = [];
  const messagesMeta: Array<{
    id: string;
    sequence: number;
    createdAt: string;
    tokenCount: number | null;
  }> = [];
  const episodes: Episode[] = [];
  const facts: Fact[] = [];
  const rules: Rule[] = [];
  const shared = new Map<string, Set<string>>();
  const factVectors = new Map<string, Float32Array>();
  const factEmbedderById = new Map<string, string>();
  const episodeVectors = new Map<string, Float32Array>();
  const decaySignals = new Map<
    string,
    { strength: number; lastAccessedAt: number | null; createdAt: number; archived: boolean }
  >();
  void options;

  let messageSeq = 0;
  const conflictStore = options.withConflictStore === true ? new InMemoryConflictStore() : null;
  const consolidatorStore =
    options.withConsolidatorStore === true ? new InMemoryConsolidatorStore() : null;
  const insightStore = options.withInsightStore === true ? new InMemoryInsightStore() : null;

  function blockKey(scope: SessionScope, label: string): string {
    return [scope.userId, scope.sessionId ?? '', scope.agentId ?? '', label].join('|');
  }

  const adapter: MemoryStoreAdapter = {
    async init() {},
    async close() {},
    working: {
      async list(scope) {
        return [...blocks.values()].filter(
          (b) =>
            b.userId === scope.userId &&
            b.sessionId === scope.sessionId &&
            b.agentId === scope.agentId &&
            b.deletedAt === undefined,
        );
      },
      async get(scope, label) {
        const block = blocks.get(blockKey(scope, label));
        if (block === undefined || block.deletedAt !== undefined) return null;
        return block;
      },
      async upsert(scope, block) {
        blocks.set(blockKey(scope, block.label), block);
      },
      async delete(scope, label) {
        const block = blocks.get(blockKey(scope, label));
        if (block !== undefined) {
          const updated: Block = { ...block, deletedAt: new Date().toISOString() };
          blocks.set(blockKey(scope, label), updated);
        }
      },
    },
    session: {
      async push(_scope, message) {
        messageSeq += 1;
        const id = `msg_${messageSeq}`;
        messages.push(message);
        messagesMeta.push({
          id,
          sequence: messageSeq,
          createdAt: new Date().toISOString(),
          tokenCount: null,
        });
        return { messageId: id, sequence: messageSeq, persistedAt: new Date().toISOString() };
      },
      async listMessagesSince(
        _scope: SessionScope,
        lastMessageId: string | null,
        limit: number,
      ): Promise<ReadonlyArray<SessionMessageRecord>> {
        const out: SessionMessageRecord[] = [];
        let startSeq = 0;
        if (lastMessageId !== null) {
          const cursor = messagesMeta.find((m) => m.id === lastMessageId);
          if (cursor !== undefined) startSeq = cursor.sequence;
        }
        for (let i = 0; i < messages.length && out.length < limit; i++) {
          const meta = messagesMeta[i];
          const message = messages[i];
          if (meta === undefined || message === undefined) continue;
          if (meta.sequence <= startSeq) continue;
          out.push({
            id: meta.id,
            sequence: meta.sequence,
            createdAt: meta.createdAt,
            tokenCount: meta.tokenCount,
            message,
          });
        }
        return out;
      },
      async totalCachedTokens(_scope: SessionScope): Promise<number | null> {
        if (messagesMeta.length === 0) return null;
        let total = 0;
        let hadAny = false;
        for (const meta of messagesMeta) {
          if (meta.tokenCount !== null) {
            total += meta.tokenCount;
            hadAny = true;
          }
        }
        return hadAny ? total : null;
      },
      async list(scope, opts) {
        let filtered: Message[] = messages;
        if (opts?.role !== undefined) {
          filtered = filtered.filter((m) => m.role === opts.role);
        }
        if (opts?.agentId !== undefined) {
          filtered = filtered.filter((m) => m.role === 'assistant' && m.agentId === opts.agentId);
        }
        if (opts?.lastN !== undefined) filtered = filtered.slice(-opts.lastN);
        void scope;
        return filtered;
      },
      async search(scope, query, opts) {
        void opts;
        const topK = opts?.topK ?? 10;
        const out: MemoryHit[] = [];
        for (let i = 0; i < messages.length && out.length < topK; i++) {
          const m = messages[i];
          if (m === undefined) continue;
          const text = renderMessageText(m);
          if (text.toLowerCase().includes(query.toLowerCase())) {
            out.push({
              record: {
                id: messagesMeta[i]?.id ?? `msg_${i}`,
                kind: 'session',
                userId: scope.userId,
                sensitivity: 'internal',
                createdAt: messagesMeta[i]?.createdAt ?? new Date().toISOString(),
              },
              score: 1,
            });
          }
        }
        return out;
      },
    },
    episodic: {
      async put(episode) {
        episodes.push(episode);
      },
      async putWithEmbedding(episode, opts: EmbeddedWriteOptions) {
        episodes.push(episode);
        if (opts.embedding !== undefined) {
          episodeVectors.set(episode.id, opts.embedding.vector);
        }
      },
      async get(id) {
        const ep = episodes.find((e) => e.id === id);
        if (ep === undefined) return null;
        if (ep.deletedAt !== undefined) return null;
        return ep;
      },
      async search(scope, opts) {
        const topK = opts.topK ?? 10;
        const out: MemoryHit<Episode>[] = [];
        const q = opts.query.toLowerCase();
        for (const episode of episodes) {
          if (episode.userId !== scope.userId) continue;
          if (episode.deletedAt !== undefined) continue;
          if (opts.includeQuarantined !== true && episode.status === 'quarantined') continue;
          if (opts.asOf !== undefined && Date.parse(episode.startedAt) > Date.parse(opts.asOf)) {
            continue;
          }
          if (q === '*' || episode.summary.toLowerCase().includes(q)) {
            out.push({ record: episode, score: 1, signals: { bm25: 1 } });
          }
          if (out.length >= topK) break;
        }
        return out;
      },
      async searchVector(scope, embedding, embedderId, topK, _asOf, includeQuarantined) {
        void embedderId;
        const out: Array<MemoryHit<Episode>> = [];
        for (const episode of episodes) {
          if (episode.userId !== scope.userId) continue;
          if (episode.deletedAt !== undefined) continue;
          if (includeQuarantined !== true && episode.status === 'quarantined') continue;
          const vec = episodeVectors.get(episode.id);
          if (vec === undefined) continue;
          out.push({ record: episode, score: cosine(vec, embedding) });
        }
        out.sort((a, b) => b.score - a.score);
        return out.slice(0, topK);
      },
      async archive(id, _reason) {
        const idx = episodes.findIndex((e) => e.id === id);
        if (idx >= 0) {
          const ep = episodes[idx];
          if (ep !== undefined) {
            episodes[idx] = { ...ep, deletedAt: new Date().toISOString() };
          }
        }
      },
    },
    semantic: {
      async remember(fact) {
        facts.push(fact);
      },
      async rememberWithEmbedding(fact, opts) {
        facts.push(fact);
        if (opts.embedding !== undefined) {
          factVectors.set(fact.id, opts.embedding.vector);
          factEmbedderById.set(fact.id, opts.embedding.embedderId);
        }
      },
      async get(id) {
        const fact = facts.find((f) => f.id === id);
        if (fact === undefined) return null;
        if (fact.deletedAt !== undefined) return null;
        return fact;
      },
      async search(scope, opts) {
        const topK = opts.topK ?? 10;
        const q = opts.query.toLowerCase();
        const out: MemoryHit<Fact>[] = [];
        for (const fact of facts) {
          if (fact.userId !== scope.userId) continue;
          if (fact.deletedAt !== undefined) continue;
          if (opts.includeQuarantined !== true && fact.status === 'quarantined') continue;
          if (opts.asOf !== undefined && !factValidAt(fact, opts.asOf)) continue;
          if (q === '*' || fact.text.toLowerCase().includes(q)) {
            out.push({ record: fact, score: 1, signals: { bm25: 1 } });
          }
          if (out.length >= topK) break;
        }
        return out;
      },
      async historyOf(scope, factId) {
        const seen = new Set<string>();
        const queue = [factId];
        const out: Fact[] = [];
        while (queue.length > 0) {
          const id = queue.shift();
          if (id === undefined || seen.has(id)) continue;
          seen.add(id);
          const fact = facts.find((f) => f.id === id && f.userId === scope.userId);
          if (fact === undefined) continue;
          out.push(fact);
          if (fact.supersedes !== undefined) queue.push(fact.supersedes);
          if (fact.supersededBy !== undefined) queue.push(fact.supersededBy);
          for (const f of facts) {
            if (f.userId === scope.userId && (f.supersedes === id || f.supersededBy === id)) {
              queue.push(f.id);
            }
          }
        }
        out.sort((a, b) => factOrderEpoch(a) - factOrderEpoch(b));
        return out;
      },
      async searchVector(scope, embedding, embedderId, topK, _asOf, includeQuarantined) {
        const out: Array<MemoryHit<Fact>> = [];
        for (const fact of facts) {
          if (fact.userId !== scope.userId) continue;
          if (fact.deletedAt !== undefined) continue;
          if (includeQuarantined !== true && fact.status === 'quarantined') continue;
          const vec = factVectors.get(fact.id);
          if (vec === undefined) continue;
          // The default sqlite store gates vector reads by `embedder_id`
          // — mirror that here so the multi-active strategy can be
          // exercised without a SQL engine.
          if (factEmbedderById.get(fact.id) !== embedderId) continue;
          out.push({ record: fact, score: cosine(vec, embedding) });
        }
        out.sort((a, b) => b.score - a.score);
        return out.slice(0, topK);
      },
      async setStatus(factId, status, _reason) {
        const idx = facts.findIndex((f) => f.id === factId);
        if (idx >= 0) {
          const fact = facts[idx];
          if (fact !== undefined) {
            facts[idx] = { ...fact, status, updatedAt: new Date().toISOString() };
          }
        }
      },
      async supersede(oldId, newFact) {
        const idx = facts.findIndex((f) => f.id === oldId);
        if (idx >= 0) {
          const old = facts[idx];
          if (old !== undefined) {
            // Mirror the sqlite adapter: close the old validity interval at
            // the new fact's validFrom (COALESCE — never clobber an explicit
            // close) so asOf queries exclude the superseded fact (P0-3).
            facts[idx] = {
              ...old,
              supersededBy: newFact.id,
              validTo: old.validTo ?? newFact.validFrom ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
        }
      },
      async forget(id) {
        const idx = facts.findIndex((f) => f.id === id);
        if (idx >= 0) {
          const old = facts[idx];
          if (old !== undefined) {
            facts[idx] = { ...old, deletedAt: new Date().toISOString() };
          }
        }
      },
      async purge(id, _reason) {
        const idx = facts.findIndex((f) => f.id === id);
        if (idx >= 0) {
          facts.splice(idx, 1);
          factVectors.delete(id);
          factEmbedderById.delete(id);
        }
      },
      async listForDecay(scope, limit = 1000) {
        const out: Array<{
          id: string;
          text: string;
          strength: number;
          lastAccessedAt: number | null;
          createdAt: number;
          archived: boolean;
        }> = [];
        for (const fact of facts) {
          if (fact.userId !== scope.userId) continue;
          const sig = decaySignals.get(fact.id);
          out.push({
            id: fact.id,
            text: fact.text,
            strength: sig?.strength ?? 1,
            lastAccessedAt: sig?.lastAccessedAt ?? null,
            createdAt: sig?.createdAt ?? Date.parse(fact.createdAt),
            archived: sig?.archived ?? false,
          });
          if (out.length >= limit) break;
        }
        return out;
      },
      async archiveFact(id, _reason) {
        const sig = decaySignals.get(id) ?? {
          strength: 1,
          lastAccessedAt: null,
          createdAt: Date.now(),
          archived: false,
        };
        decaySignals.set(id, { ...sig, archived: true });
        const idx = facts.findIndex((f) => f.id === id);
        if (idx >= 0) {
          const fact = facts[idx];
          if (fact !== undefined) {
            facts[idx] = { ...fact, deletedAt: new Date().toISOString() };
          }
        }
      },
    },
    procedural: {
      async add(rule) {
        rules.push(rule);
      },
      async list(scope) {
        return rules.filter((r) => r.userId === scope.userId && r.deletedAt === undefined);
      },
      async remove(id) {
        const idx = rules.findIndex((r) => r.id === id);
        if (idx >= 0) {
          const rule = rules[idx];
          if (rule !== undefined) {
            rules[idx] = { ...rule, deletedAt: new Date().toISOString() };
          }
        }
      },
    },
    shared: {
      async attach(recordId, agentId) {
        if (!shared.has(agentId)) shared.set(agentId, new Set());
        shared.get(agentId)?.add(recordId);
      },
      async detach(recordId, agentId) {
        shared.get(agentId)?.delete(recordId);
      },
      async listFor(agentId) {
        const ids = [...(shared.get(agentId) ?? [])];
        return ids.map((id) => ({
          id,
          kind: 'shared' as const,
          userId: '',
          sensitivity: 'internal' as const,
          createdAt: new Date().toISOString(),
        }));
      },
    },
    ...(conflictStore !== null ? { conflicts: conflictStore } : {}),
    ...(consolidatorStore !== null ? { consolidator: consolidatorStore } : {}),
    ...(insightStore !== null ? { insights: insightStore } : {}),
  };

  const hooks: InMemoryStoreTestHooks = {
    setTokenCount(messageId, tokenCount) {
      const meta = messagesMeta.find((m) => m.id === messageId);
      if (meta !== undefined) meta.tokenCount = tokenCount;
    },
    setDecaySignals(factId, signals) {
      const existing = decaySignals.get(factId) ?? {
        strength: 1,
        lastAccessedAt: null,
        createdAt: Date.now(),
        archived: false,
      };
      decaySignals.set(factId, {
        ...existing,
        ...(signals.strength !== undefined ? { strength: signals.strength } : {}),
        ...(signals.lastAccessedAt !== undefined ? { lastAccessedAt: signals.lastAccessedAt } : {}),
        ...(signals.createdAt !== undefined ? { createdAt: signals.createdAt } : {}),
        ...(signals.archived !== undefined ? { archived: signals.archived } : {}),
      });
    },
    registerFactEmbedder(factId, embedderId) {
      factEmbedderById.set(factId, embedderId);
    },
  };

  const conflictHooks: InMemoryConflictHooks | null =
    conflictStore !== null
      ? {
          get audit() {
            return [...conflictStore.audit];
          },
          get pending() {
            return [...conflictStore.rawPending()];
          },
        }
      : null;

  const consolidatorHooks: InMemoryConsolidatorHooks | null =
    consolidatorStore !== null
      ? {
          get state() {
            return new Map(consolidatorStore.state);
          },
          get runs() {
            return [...consolidatorStore.runs];
          },
          get dlq() {
            return [...consolidatorStore.dlq.values()];
          },
        }
      : null;

  return Object.assign(adapter, {
    __hooks: hooks,
    __conflicts: conflictHooks,
    __consolidator: consolidatorHooks,
    get __insights(): ReadonlyArray<Insight> | null {
      return insightStore === null ? null : [...insightStore.rows];
    },
  });
}

function renderMessageText(message: Message): string {
  if (message.role === 'system') return message.content;
  const c = message.content;
  if (typeof c === 'string') return c;
  return c
    .map((part) => {
      if (part.type === 'text') return part.text;
      if (part.type === 'reasoning') return part.text;
      return '';
    })
    .join(' ');
}

/** Mirror the store's fact validity-interval check for `asOf` reads. */
function factValidAt(fact: Fact, asOf: string): boolean {
  const at = Date.parse(asOf);
  const from = fact.validFrom !== undefined ? Date.parse(fact.validFrom) : null;
  const to = fact.validTo !== undefined ? Date.parse(fact.validTo) : null;
  return (from === null || from <= at) && (to === null || to > at);
}

/** Sort key for `historyOf` — `validFrom`, falling back to `createdAt`. */
function factOrderEpoch(fact: Fact): number {
  return Date.parse(fact.validFrom ?? fact.createdAt);
}

function cosine(a: Float32Array, b: Float32Array): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

/**
 * Tiny deterministic embedder used by the test suite. Emits an
 * `dim`-component unit vector whose components are seeded from
 * (text-hash, dimension-index) and centered around zero so that
 * unrelated texts produce nearly-orthogonal vectors. This is critical
 * for the conflict-pipeline tests: a positive-only vector basis
 * collapses every cosine similarity into the `[0.5, 1.0]` range and
 * spuriously triggers the HOT/NEAR-DUP zones.
 */
export function createStubEmbedder(
  opts: { id?: string; dim?: number; configHash?: string } = {},
): EmbedderProvider {
  const id = opts.id ?? 'stub:hash@32';
  const dim = opts.dim ?? 32;
  const configHash = opts.configHash ?? 'stub-config';
  return {
    id() {
      return id;
    },
    dim() {
      return dim;
    },
    configHash() {
      return configHash;
    },
    async embed(texts) {
      return texts.map((text) => textToUnitVector(text, dim));
    },
  };
}

function textToUnitVector(text: string, dim: number): Float32Array {
  const out = new Float32Array(dim);
  const baseHash = fnv1a(text);
  for (let i = 0; i < dim; i++) {
    const seed = (baseHash ^ Math.imul(i + 1, 2654435761)) >>> 0;
    out[i] = mulberryUnit(seed);
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    const v = out[i] ?? 0;
    norm += v * v;
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) {
    out[i] = (out[i] ?? 0) / norm;
  }
  return out;
}

function fnv1a(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberryUnit(seed: number): number {
  // Map a 32-bit seed to (-1, 1) using a single mulberry-style step.
  let s = (seed + 0x6d2b79f5) >>> 0;
  s = Math.imul(s ^ (s >>> 15), s | 1);
  s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
  const r = ((s ^ (s >>> 14)) >>> 0) / 0x100000000;
  return r * 2 - 1;
}

export type MessageRefShape = MessageRef;
