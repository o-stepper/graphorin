import type { Sensitivity } from './sensitivity.js';

/**
 * The six tiers of the Graphorin memory model. Used as the discriminator
 * for `MemoryStore` sub-namespaces, span types, and the `MemoryRecord`
 * union.
 *
 * @stable
 */
export type MemoryKind = 'working' | 'session' | 'episodic' | 'semantic' | 'procedural' | 'shared';

/**
 * Snapshot of memory-tier counters surfaced to the model via the
 * memory-aware system prompt. Implementations live in `@graphorin/memory`;
 * the type sits here so the agent runtime can include it in its
 * `RunContext` without a memory dependency.
 *
 * @stable
 */
export interface MemoryMetadata {
  /** Total number of facts in the user's semantic memory. */
  readonly factCount: number;
  /** Number of episodes stored for the user. */
  readonly episodeCount: number;
  /** Number of past messages indexed for retrieval. */
  readonly messageCount: number;
  /** Active rules count (after context filtering). */
  readonly activeRuleCount: number;
  /** Number of declared working blocks. */
  readonly workingBlockCount: number;
  /** Last consolidator run, ISO-8601, if any. */
  readonly lastConsolidatedAt?: string;
  /** Optional, free-form metadata tags surfaced to the model. */
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Marker shared by every memory record. Concrete records (`Block`,
 * `Fact`, `Episode`, `Rule`, message rows) all extend it.
 *
 * @stable
 */
export interface MemoryRecord {
  readonly id: string;
  readonly kind: MemoryKind;
  readonly userId: string;
  readonly agentId?: string;
  readonly sessionId?: string;
  readonly sensitivity: Sensitivity;
  readonly createdAt: string;
  readonly updatedAt?: string;
  /**
   * Soft-delete tombstone. Append-only stores set this instead of removing
   * rows, so prior history is preserved per principle 8.
   */
  readonly deletedAt?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Working-memory block — a labeled, char-bounded slot rendered into the
 * system prompt every turn.
 *
 * @stable
 */
export interface Block extends MemoryRecord {
  readonly kind: 'working';
  readonly label: string;
  readonly description?: string;
  readonly value: string;
  readonly charLimit: number;
  readonly readOnly?: boolean;
}

/**
 * Single semantic-memory fact: an atomic statement about the user / world.
 *
 * @stable
 */
export interface Fact extends MemoryRecord {
  readonly kind: 'semantic';
  readonly text: string;
  readonly confidence?: number;
  /** Bi-temporal: when the fact became true, ISO-8601. */
  readonly validFrom?: string;
  /** Bi-temporal: when the fact stopped being true, ISO-8601. */
  readonly validTo?: string;
  /** ID of the fact this one supersedes, if any. */
  readonly supersedes?: string;
  /** ID of the fact that supersedes this one, if any. */
  readonly supersededBy?: string;
}

/**
 * Episode — a summarized stretch of past activity.
 *
 * @stable
 */
export interface Episode extends MemoryRecord {
  readonly kind: 'episodic';
  readonly summary: string;
  /** ISO-8601 of the earliest event in the episode. */
  readonly startedAt: string;
  /** ISO-8601 of the latest event in the episode. */
  readonly endedAt: string;
  /** Optional importance score in `[0, 1]`. */
  readonly importance?: number;
}

/**
 * Procedural rule — a standing order activated when its `condition` matches.
 *
 * @stable
 */
export interface Rule extends MemoryRecord {
  readonly kind: 'procedural';
  readonly text: string;
  readonly condition?: string;
  readonly priority: number;
}

/**
 * Search options shared across memory tiers.
 *
 * @stable
 */
export interface MemorySearchOptions {
  readonly query: string;
  readonly topK?: number;
  readonly tags?: ReadonlyArray<string>;
  readonly dateRange?: { readonly from?: string; readonly to?: string };
  readonly includeArchived?: boolean;
  readonly signal?: AbortSignal;
  /**
   * Point-in-time ("as of") read. When set, only records whose
   * validity interval contains this instant are returned. For facts:
   * `(valid_from IS NULL OR valid_from <= asOf) AND (valid_to IS NULL OR valid_to > asOf)`;
   * for episodes: `started_at <= asOf`. ISO-8601. Absent ⇒ current
   * behaviour is unchanged (every live row is eligible).
   */
  readonly asOf?: string;
}

/**
 * A single retrieval hit with similarity / relevance metadata.
 *
 * @stable
 */
export interface MemoryHit<TRecord extends MemoryRecord = MemoryRecord> {
  readonly record: TRecord;
  readonly score: number;
  /** Optional source signals contributing to `score` (BM25, vec, RRF, …). */
  readonly signals?: Readonly<Record<string, number>>;
}
