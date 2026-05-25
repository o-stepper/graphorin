import type {
  EmbedderProvider,
  Episode,
  EpisodicMemoryStore,
  Fact,
  MemoryHit,
  MemoryStatus,
  MemoryStore,
  Message,
  MessageRef,
  ProceduralMemoryStore,
  SemanticMemoryStore,
  SessionListOptions,
  SessionMemoryStore,
  SessionScope,
  SharedMemoryStore,
  WorkingMemoryStore,
} from '@graphorin/core';

/**
 * Shape of the embedding payload threaded through the optional
 * embedded write helpers exposed by adapters such as
 * `@graphorin/store-sqlite`. Matches the storage adapter's
 * `SqliteMemoryWriteOptions` byte-for-byte but is declared
 * structurally here so `@graphorin/memory` does not import the
 * storage package directly.
 *
 * @stable
 */
export interface EmbeddedWriteOptions {
  readonly embedding?: {
    readonly embedderId: string;
    readonly vector: Float32Array;
  };
}

/**
 * Extension of the typed `EpisodicMemoryStore` with optional
 * embedding-aware helpers + lifecycle helpers that storage adapters
 * may expose.
 *
 * @stable
 */
export interface EpisodicMemoryStoreExt extends EpisodicMemoryStore {
  putWithEmbedding?(episode: Episode, options: EmbeddedWriteOptions): Promise<void>;
  searchVector?(
    scope: SessionScope,
    embedding: Float32Array,
    embedderId: string,
    topK: number,
    /** Point-in-time filter (`started_at <= asOf`, ISO-8601). P0-2. */
    asOf?: string,
    /** Include quarantined episodes (validation/inspector path). P1-4. */
    includeQuarantined?: boolean,
  ): Promise<ReadonlyArray<MemoryHit<Episode>>>;
  /** Mark an episode archived. Soft-archive — the row stays for replay. */
  archive?(id: string, reason?: string): Promise<void>;
}

/**
 * Extension of the typed `SemanticMemoryStore` with optional
 * embedding-aware helpers + lifecycle helpers that storage adapters
 * may expose.
 *
 * @stable
 */
export interface SemanticMemoryStoreExt extends SemanticMemoryStore {
  rememberWithEmbedding?(fact: Fact, options: EmbeddedWriteOptions): Promise<void>;
  searchVector?(
    scope: SessionScope,
    embedding: Float32Array,
    embedderId: string,
    topK: number,
    /**
     * Point-in-time filter applied after KNN: only facts whose
     * validity interval contains `asOf` (ISO-8601) survive. P0-2.
     */
    asOf?: string,
    /**
     * Include quarantined facts in the KNN result (validation /
     * inspector path). Default reads exclude them. P1-4.
     */
    includeQuarantined?: boolean,
  ): Promise<ReadonlyArray<MemoryHit<Fact>>>;
  /** Lookup a single fact by id (returns `null` when absent or soft-deleted). */
  get?(id: string): Promise<Fact | null>;
  /**
   * Set a fact's retrieval-trust `status` and write a `memory_history`
   * audit row (P1-4). Promotes a quarantined fact to `active` (the
   * validation path) or re-quarantines an active one. Never touches
   * content / embedding / tombstone — quarantine is a retrieval gate.
   * Powers {@link SemanticMemory.validate}; the default
   * `@graphorin/store-sqlite` adapter implements it.
   */
  setStatus?(factId: string, status: MemoryStatus, reason?: string): Promise<void>;
  /**
   * Hard-delete a fact (GDPR path). The audit log row is preserved
   * but the row itself + every per-embedder vec0 entry is removed.
   * Distinct from {@link SemanticMemoryStore.forget} (soft-delete).
   */
  purge?(id: string, reason?: string): Promise<void>;
  /**
   * Walk the bi-temporal supersede chain that `factId` belongs to and
   * return every fact in it, oldest → newest (by `validFrom`),
   * including superseded / soft-deleted rows so callers can answer
   * "how did this fact change over time". Scope-guarded and
   * cycle-safe; returns `[]` for an unknown id. Powers
   * {@link SemanticMemory.history} (P0-2). The default
   * `@graphorin/store-sqlite` adapter implements it.
   */
  historyOf?(scope: SessionScope, factId: string): Promise<ReadonlyArray<Fact>>;
}

/**
 * Single message tuple returned by
 * {@link SessionMemoryStoreExt.listMessagesSince}. The optional
 * `tokenCount` field is the value cached in the storage layer
 * (DEC-131); `null` indicates the cache is empty.
 *
 * @stable
 */
export interface SessionMessageRecord {
  readonly id: string;
  readonly sequence: number;
  readonly createdAt: string;
  readonly tokenCount: number | null;
  readonly message: Message;
}

/**
 * Extension of the typed `SessionMemoryStore` with optional
 * token-cache + vector-search + cursor-aware reader helpers that
 * storage adapters may expose.
 *
 * @stable
 */
export interface SessionMemoryStoreExt extends SessionMemoryStore {
  searchVector?(
    scope: SessionScope,
    embedding: Float32Array,
    embedderId: string,
    topK: number,
  ): Promise<ReadonlyArray<MemoryHit>>;
  /**
   * Sum of `session_messages.token_count` for the supplied scope.
   * Returns `null` when the cache is empty / partially populated so
   * callers can fall back to a heuristic. Surfaced per DEC-131.
   */
  totalCachedTokens?(scope: SessionScope): Promise<number | null>;
  /**
   * List messages for the supplied scope past the optional
   * `lastMessageId` cursor, oldest-first, capped at `limit`. Used by
   * the consolidator's standard phase to advance the per-scope
   * idempotency cursor without rereading already-processed turns.
   */
  listMessagesSince?(
    scope: SessionScope,
    lastMessageId: string | null,
    limit: number,
  ): Promise<ReadonlyArray<SessionMessageRecord>>;
}

/**
 * Optional extension surface for storage adapters' embedder registry.
 * The interface is structural so any adapter that matches the shape
 * works.
 *
 * @stable
 */
export interface EmbeddingMetaRegistryLike {
  registerOrReturn(input: {
    readonly id: string;
    readonly embedderKind: string;
    readonly model: string;
    readonly dim: number;
    readonly distanceMetric?: 'cosine' | 'dot' | 'euclidean';
    readonly configHash: string;
    readonly notes?: string | null;
  }): { readonly id: string };
  get(id: string): unknown | null;
  assertKnown(id: string): void;
  retire(id: string, retiredAt?: number): void;
  listAll(): ReadonlyArray<{ readonly id: string; readonly retiredAt: number | null }>;
  listActive(): ReadonlyArray<{ readonly id: string; readonly retiredAt: number | null }>;
}

/**
 * Stable lowercase identifier for the pipeline stage that produced a
 * conflict decision. Mirrored byte-for-byte by
 * `@graphorin/store-sqlite`'s `ConflictPipelineStage`.
 *
 * @stable
 */
export type ConflictAuditStage =
  | 'exact-dedup'
  | 'embedding-three-zone'
  | 'heuristic-regex'
  | 'subject-predicate'
  | 'defer-to-deep';

/**
 * Final pipeline outcome recorded against the candidate fact. Matches
 * the storage adapter's `ConflictPipelineDecision` exactly.
 *
 * @stable
 */
export type ConflictAuditDecision = 'admit' | 'dedup' | 'supersede' | 'pending';

/**
 * Single audit row written by `runConflictPipeline(...)`. The optional
 * `ConflictMemoryStoreExt.recordDecision` accepts this shape; the
 * default `@graphorin/store-sqlite` implementation persists it into
 * the `fact_conflicts` table introduced by Phase 10b.
 *
 * @stable
 */
export interface ConflictAuditInputLike {
  readonly scope: SessionScope;
  readonly candidateId: string;
  readonly existingId?: string;
  readonly decision: ConflictAuditDecision;
  readonly stage: ConflictAuditStage;
  readonly detectionZone?: string;
  readonly similarity?: number;
  readonly reason?: string;
  readonly detectedBy?: string;
}

/**
 * Pending-queue payload — Stage 5 (defer-to-deep) hands the row over
 * to the deep-phase LLM judge (Phase 10c).
 *
 * @stable
 */
export interface PendingConflictInputLike {
  readonly scope: SessionScope;
  readonly factId: string;
  readonly candidateText: string;
  readonly stage: ConflictAuditStage;
  readonly reason?: string;
  /** Top-K conflicting existing fact ids surfaced by Stage 2. */
  readonly conflictingIds?: ReadonlyArray<string>;
}

/**
 * Read-back shape returned by `listPending(...)`.
 *
 * @stable
 */
export interface PendingConflictRowLike {
  readonly id: number;
  readonly scopeUserId: string;
  readonly factId: string;
  readonly candidateText: string;
  readonly stage: string;
  readonly reason: string | null;
  readonly enqueuedAt: number;
  readonly attemptedAt: number | null;
  readonly resolvedAt: number | null;
  readonly decision: string | null;
  /** Top-K conflicting existing fact ids; empty when omitted at enqueue. */
  readonly conflictingIds: ReadonlyArray<string>;
}

/**
 * Optional storage extension surfacing the audit + pending queue
 * tables Phase 10b owns. Adapters that opt out leave the property
 * undefined; the conflict pipeline degrades gracefully (no audit, no
 * deferred queue, but every other stage still functions).
 *
 * @stable
 */
export interface ConflictMemoryStoreExt {
  recordDecision(input: ConflictAuditInputLike): Promise<{
    readonly id: number;
    readonly detectedAt: number;
  }>;
  enqueuePending(input: PendingConflictInputLike): Promise<{ readonly id: number }>;
  listPending(scope: SessionScope, limit?: number): Promise<ReadonlyArray<PendingConflictRowLike>>;
  markResolved(id: number, decision: ConflictAuditDecision): Promise<void>;
}

/**
 * Persisted per-scope consolidator state row mirrored byte-for-byte
 * by `@graphorin/store-sqlite`'s `consolidator_state` table. The lock
 * fields (`activeLockHeldBy` / `activeLockAcquiredAt`) are populated
 * while a phase is running and cleared when it finishes; the cursor
 * fields advance as the standard phase processes a batch of
 * messages.
 *
 * @stable
 */
export interface ConsolidatorStateRow {
  readonly scope: SessionScope;
  readonly lastProcessedMessageId: string | null;
  readonly lastPhase: 'light' | 'standard' | 'deep' | null;
  readonly lastCompletedAt: number | null;
  readonly nextEligibleAt: number | null;
  readonly activeLockHeldBy: string | null;
  readonly activeLockAcquiredAt: number | null;
}

/**
 * Patch shape accepted by
 * {@link ConsolidatorMemoryStoreExt.upsertState}. Every field is
 * optional so callers may advance the cursor and the run stamp
 * independently. `null` clears a column; `undefined` leaves it
 * untouched.
 *
 * @stable
 */
export interface ConsolidatorStatePatch {
  readonly lastProcessedMessageId?: string | null;
  readonly lastPhase?: 'light' | 'standard' | 'deep' | null;
  readonly lastCompletedAt?: number | null;
  readonly nextEligibleAt?: number | null;
  readonly activeLockHeldBy?: string | null;
  readonly activeLockAcquiredAt?: number | null;
}

/**
 * Phase invocation audit row written to `consolidator_runs`. The
 * accompanying `id` is generated by the caller so a partial / failed
 * run can be reconciled by replay.
 *
 * @stable
 */
export interface ConsolidatorRunInput {
  readonly id: string;
  readonly scope: SessionScope;
  readonly triggerKind: 'turn' | 'idle' | 'cron' | 'event' | 'budget' | 'manual';
  readonly phase: 'light' | 'standard' | 'deep';
  readonly startedAt: number;
}

/** @stable */
export interface ConsolidatorRunFinish {
  readonly id: string;
  readonly finishedAt: number;
  readonly status: 'completed' | 'failed' | 'deferred' | 'partial';
  readonly llmTokensUsed?: number;
  readonly llmCostUsd?: number | null;
  readonly factsCreated?: number;
  readonly factsUpdated?: number;
  readonly conflictsResolved?: number;
  readonly noiseFilteredCount?: number;
  readonly emptyExtractions?: number;
  readonly errorMessage?: string | null;
  readonly retryCount?: number;
}

/** @stable */
export interface DlqBatchInput {
  readonly id: string;
  readonly consolidatorRunId: string | null;
  readonly scope: SessionScope;
  readonly messageIds: ReadonlyArray<string>;
  readonly errorKind: string;
  readonly errorMessage: string;
  readonly failedAt: number;
  readonly nextRetryAt: number;
  readonly retryCount: number;
}

/** @stable */
export interface DlqBatchRow {
  readonly id: string;
  readonly consolidatorRunId: string | null;
  readonly scope: SessionScope;
  readonly messageIds: ReadonlyArray<string>;
  readonly errorKind: string;
  readonly errorMessage: string;
  readonly failedAt: number;
  readonly nextRetryAt: number | null;
  readonly retryCount: number;
}

/**
 * Optional consolidator-state surface every storage adapter exposes
 * for Phase 10c. Mirrors the `consolidator_state`,
 * `consolidator_runs`, and `consolidator_failed_batches` tables
 * shipped in Phase 05's migration 009. Adapters that do not
 * implement the surface degrade gracefully — the consolidator runs
 * in stateless mode (no DLQ, no cursor persistence) and emits a
 * one-shot WARN.
 *
 * @stable
 */
export interface ConsolidatorMemoryStoreExt {
  getState(scope: SessionScope): Promise<ConsolidatorStateRow | null>;
  upsertState(scope: SessionScope, patch: ConsolidatorStatePatch): Promise<ConsolidatorStateRow>;
  /**
   * Atomically claim the per-scope lock. Returns `true` when the
   * row was either unlocked, owned by `runId`, or stale (the held
   * timestamp is older than `maxAgeMs`); `false` otherwise. The
   * `now` argument allows the lock manager to inject a deterministic
   * clock during tests.
   */
  acquireLock(scope: SessionScope, runId: string, now: number, maxAgeMs: number): Promise<boolean>;
  releaseLock(scope: SessionScope, runId: string): Promise<void>;

  recordRunStart(input: ConsolidatorRunInput): Promise<void>;
  recordRunFinish(finish: ConsolidatorRunFinish): Promise<void>;
  listRecentRuns(
    scope: SessionScope,
    limit?: number,
  ): Promise<
    ReadonlyArray<{
      readonly id: string;
      readonly phase: 'light' | 'standard' | 'deep';
      readonly status: string;
      readonly startedAt: number;
      readonly finishedAt: number | null;
      readonly llmCostUsd: number | null;
      readonly llmTokensUsed: number;
      readonly factsCreated: number;
      readonly factsUpdated: number;
    }>
  >;

  enqueueFailedBatch(input: DlqBatchInput): Promise<void>;
  /**
   * Claim every DLQ row whose `nextRetryAt` is at or before `now`,
   * up to `limit`. Returns the rows in failed-at order so the
   * oldest backlog drains first.
   */
  claimReadyBatches(
    scope: SessionScope,
    now: number,
    limit?: number,
  ): Promise<ReadonlyArray<DlqBatchRow>>;
  /** Mark the row succeeded — removes it from the DLQ. */
  markBatchSucceeded(id: string): Promise<void>;
  /**
   * Schedule the next retry attempt. The caller computes
   * `nextRetryAt` so the backoff schedule is centralized in the
   * consolidator.
   */
  rescheduleBatch(id: string, retryCount: number, nextRetryAt: number): Promise<void>;
  /**
   * Mark the row exhausted (`retryCount` exceeded the configured
   * cap). The row stays in the DLQ for operator inspection.
   * Implementations MUST clear `nextRetryAt` so the row is no
   * longer eligible for `claimReadyBatches`. The optional
   * `retryCount` argument is recorded against the row so the
   * persisted count reflects the final attempt that triggered the
   * exhaustion.
   */
  markBatchExhausted(id: string, errorMessage: string, retryCount?: number): Promise<void>;
  listFailedBatches(scope: SessionScope, limit?: number): Promise<ReadonlyArray<DlqBatchRow>>;
}

/**
 * Decay-aware extension of the typed `SemanticMemoryStore`. Phase
 * 10c's light phase reads the strength + last-accessed columns and
 * archives facts whose retention curve falls below the configured
 * threshold. Adapters that do not maintain decay columns may omit
 * the surface entirely — the light phase skips the archive step
 * with an INFO log.
 *
 * @stable
 */
export interface DecayMemoryStoreExt {
  /**
   * List facts for the scope ordered by `lastAccessedAt` ASC so the
   * caller can apply Ebbinghaus retention without scanning the
   * whole table. `limit` defaults to `1000`.
   */
  listForDecay(
    scope: SessionScope,
    limit?: number,
  ): Promise<
    ReadonlyArray<{
      readonly id: string;
      readonly text: string;
      readonly strength: number;
      readonly lastAccessedAt: number | null;
      readonly createdAt: number;
      readonly archived: boolean;
    }>
  >;
  /**
   * Soft-archive a fact (sets `archived = 1`). The audit row in
   * `memory_history` records the archive event.
   */
  archiveFact(id: string, reason?: string): Promise<void>;
}

/**
 * Composite shape every `@graphorin/memory` consumer must supply at
 * construction time. Mirrors the typed `MemoryStore` from
 * `@graphorin/core` but widens the per-tier sub-store types with the
 * optional embedding-aware extension methods.
 *
 * Concrete adapters (most notably `@graphorin/store-sqlite`)
 * implement every member by construction; in-memory test doubles
 * implement the minimum and leave the optional members undefined.
 *
 * @stable
 */
export interface MemoryStoreAdapter extends Omit<MemoryStore, 'session' | 'episodic' | 'semantic'> {
  readonly session: SessionMemoryStoreExt;
  readonly episodic: EpisodicMemoryStoreExt;
  readonly semantic: SemanticMemoryStoreExt & Partial<DecayMemoryStoreExt>;
  /**
   * Optional conflict audit + pending queue surface. Defined on the
   * default `@graphorin/store-sqlite` adapter, omitted on the
   * minimal in-memory test doubles.
   *
   * @stable
   */
  readonly conflicts?: ConflictMemoryStoreExt;
  /**
   * Optional consolidator state + runs + DLQ surface. Defined on
   * the default `@graphorin/store-sqlite` adapter; in-memory test
   * doubles may opt in via the fixture.
   *
   * @stable
   */
  readonly consolidator?: ConsolidatorMemoryStoreExt;
}

/**
 * Re-export of session memory shape we use locally for narrower
 * types inside the facade.
 *
 * @internal
 */
export type SessionListResult = ReadonlyArray<Message>;

export type {
  EmbedderProvider,
  Episode,
  EpisodicMemoryStore,
  Fact,
  Message,
  MessageRef,
  ProceduralMemoryStore,
  SemanticMemoryStore,
  SessionListOptions,
  SessionMemoryStore,
  SessionScope,
  SharedMemoryStore,
  WorkingMemoryStore,
};
