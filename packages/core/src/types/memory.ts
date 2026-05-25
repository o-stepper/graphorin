import type { Sensitivity } from './sensitivity.js';

/**
 * Kinds of memory record in the Graphorin model. The first six are the
 * storage tiers the {@link MemoryStore} contract exposes as 1:1
 * sub-namespaces; `insight` is the derived, reflection-synthesized
 * record kind (P1-1) — it has no base-tier namespace and is persisted
 * through the optional insight surface adapters expose. Used as the
 * discriminator for span types and the `MemoryRecord` union.
 *
 * @stable
 */
export type MemoryKind =
  | 'working'
  | 'session'
  | 'episodic'
  | 'semantic'
  | 'procedural'
  | 'shared'
  | 'insight';

/**
 * Where a memory came from — the trust-provenance tag carried by every
 * fact / episode / induced procedure. `user` (the human said it) and
 * `tool` (a tool the agent invoked returned it) are first-party;
 * `extraction` (consolidator distilled it from a transcript),
 * `reflection` (a synthesis pass inferred it), and `induction` (an
 * AWM-style pass distilled a reusable workflow from a successful agent
 * trajectory, P2-2) are *derived* and therefore land quarantined by
 * default; `imported` is bulk-loaded from an external store. Used by
 * P1-4 to gate action-driving recall against memory-poisoning (MINJA /
 * MemoryGraft) — induced procedures drive *actions*, so the quarantine
 * gate matters most for them.
 *
 * @stable
 */
export type MemoryProvenance =
  | 'user'
  | 'tool'
  | 'extraction'
  | 'reflection'
  | 'induction'
  | 'imported';

/**
 * Retrieval-trust state of a memory. `active` rows are eligible for
 * default recall; `quarantined` rows are persisted and auditable but
 * excluded from action-driving recall until explicitly validated (P1-4).
 * Quarantine is a *retrieval gate*, never a delete.
 *
 * @stable
 */
export type MemoryStatus = 'active' | 'quarantined';

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
  /**
   * Structured `(subject, predicate, object)` triple for the in-SQLite
   * relation graph (P2-1). The consolidator's extraction prompt emits
   * these; first-party `remember({ text })` writes usually omit them.
   * `subject`/`object` are the graph *entities* (resolved to canonical
   * ids in `fact_entities`); `predicate` is the relation label and is
   * not itself an entity. Absent on rows written before the feature, and
   * on plain free-text facts — they are a soft enrichment that powers
   * one-hop expansion ({@link MemorySearchOptions} has no field; the
   * memory tier's search opts in), never a recall gate.
   */
  readonly subject?: string;
  /** Relation label of the {@link Fact.subject}→{@link Fact.object} triple (P2-1). */
  readonly predicate?: string;
  /** Object entity of the s/p/o triple (P2-1). See {@link Fact.subject}. */
  readonly object?: string;
  readonly confidence?: number;
  /**
   * Optional salience hint in `[0, 1]` for multi-signal forgetting
   * (X-1). A *soft* signal — higher importance slows a fact's decay and
   * delays capacity-bounded eviction, but never gates recall and never
   * forces retention. Absent on rows written before the feature
   * (treated as neutral, `0.5`).
   */
  readonly importance?: number;
  /** Bi-temporal: when the fact became true, ISO-8601. */
  readonly validFrom?: string;
  /** Bi-temporal: when the fact stopped being true, ISO-8601. */
  readonly validTo?: string;
  /** ID of the fact this one supersedes, if any. */
  readonly supersedes?: string;
  /** ID of the fact that supersedes this one, if any. */
  readonly supersededBy?: string;
  /**
   * Trust-provenance tag (P1-4). Absent on rows written before the
   * feature; treated as first-party (`active`) when missing.
   */
  readonly provenance?: MemoryProvenance;
  /**
   * Retrieval-trust state (P1-4). Defaults to `active`; derived /
   * injection-flagged writes land `quarantined` and are excluded from
   * default recall.
   */
  readonly status?: MemoryStatus;
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
  /** Trust-provenance tag (P1-4). See {@link MemoryProvenance}. */
  readonly provenance?: MemoryProvenance;
  /** Retrieval-trust state (P1-4). See {@link MemoryStatus}. */
  readonly status?: MemoryStatus;
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
  /**
   * Ordered, value-abstracted step sequence of an *induced* workflow
   * (P2-2) — e.g. `['search for {product}', 'add {quantity} to cart',
   * 'check out']`. Present only on procedures distilled from successful
   * agent trajectories; author-defined rules omit it.
   */
  readonly steps?: ReadonlyArray<string>;
  /**
   * Names of the variables abstracted from the trajectory's concrete
   * values (P2-2) — the `{product}` / `{quantity}` placeholders that
   * appear in {@link Rule.steps}. Lets a reused procedure be re-bound to
   * fresh arguments instead of replaying one run's literals.
   */
  readonly variables?: ReadonlyArray<string>;
  /**
   * Voyager-style verifiable success criteria stored alongside an induced
   * procedure (P2-2) so a reuse can *self-verify* its outcome instead of
   * trusting the procedure blindly. Author-defined rules omit it.
   */
  readonly successCriteria?: ReadonlyArray<string>;
  /**
   * Trust-provenance tag (P1-4 / P2-2). Induced procedures are
   * `'induction'`; author-defined rules omit it (treated first-party).
   * See {@link MemoryProvenance}.
   */
  readonly provenance?: MemoryProvenance;
  /**
   * Retrieval-trust state (P1-4 / P2-2). Induced procedures land
   * `'quarantined'` and are excluded from activation (they must not drive
   * actions) until validated; author-defined rules omit it (treated
   * `'active'`). See {@link MemoryStatus}.
   */
  readonly status?: MemoryStatus;
}

/**
 * Insight — a higher-order observation the consolidator's reflection
 * pass (P1-1) synthesizes over recent memories ("the user has cancelled
 * three evening plans this month — they may be overcommitted"). No
 * single turn states it; it is *inferred*, so it is always
 * `provenance: 'reflection'` and lands `status: 'quarantined'` (P1-4),
 * excluded from action-driving recall until validated.
 *
 * Every insight carries **mandatory citations** (`cites`) — the ids of
 * the supporting memories it was synthesized from — so a reader can
 * trace it back to evidence; this is the "trustworthy reflection"
 * mitigation against confirmation-bias loops. Insights are managed with
 * an ExpeL-style salience counter (new insights start at `2`, pruned at
 * `≤ 0`) and are retrieval-ranked **below** the primary facts they cite.
 *
 * @stable
 */
export interface Insight extends MemoryRecord {
  readonly kind: 'insight';
  /** The synthesized higher-order observation. */
  readonly text: string;
  /**
   * IDs of the supporting memories (facts / episodes) this insight was
   * synthesized from. Always ≥ 1 — citations are mandatory; an insight
   * with no traceable evidence is never persisted.
   */
  readonly cites: ReadonlyArray<string>;
  /**
   * ExpeL-style salience counter. New insights start at `2`; a
   * maintenance pass up-/down-votes on subsequent corroboration /
   * contradiction and prunes (soft-deletes) insights at `≤ 0`.
   */
  readonly salience: number;
  /**
   * Trust-provenance tag (P1-4). Reflection-synthesized insights are
   * `'reflection'`. See {@link MemoryProvenance}.
   */
  readonly provenance?: MemoryProvenance;
  /**
   * Retrieval-trust state (P1-4). Insights land `'quarantined'`. See
   * {@link MemoryStatus}.
   */
  readonly status?: MemoryStatus;
}

/**
 * Role a {@link GraphEntity} plays in a {@link Fact}'s s/p/o triple
 * (P2-1) — the `subject` or the `object`. The `predicate` is a relation
 * label, not an entity, so it has no role here.
 *
 * @stable
 */
export type EntityRole = 'subject' | 'object';

/**
 * Canonical entity in the lightweight in-SQLite relation graph (P2-1).
 * The entity resolver (`@graphorin/memory`) deduplicates the raw
 * `subject`/`object` strings on facts into canonical entities — merging
 * aliases ("Anna", "Anna S.", "my sister") via lexical + embedding
 * similarity (with optional LLM adjudication) — so multi-hop recall can
 * traverse relationships instead of fragmenting them.
 *
 * Merges are **append-only and reversible**: a merged entity is never
 * deleted — its {@link GraphEntity.mergedInto} points at the surviving
 * canonical entity, every merge / unmerge is recorded in an audit
 * ledger, and `mergedInto` is single-level (it always points directly at
 * a root), so `mergedInto ?? id` is the canonical id.
 *
 * @stable
 */
export interface GraphEntity {
  readonly id: string;
  readonly userId: string;
  /** Display name as first observed (the surface form that minted it). */
  readonly name: string;
  /** Case/space-folded key used for lexical dedup + the canonical unique index. */
  readonly normalizedName: string;
  /**
   * Canonical pointer. `undefined` ⇒ this entity is itself a root.
   * Otherwise it is the id of the surviving entity this one was merged
   * into; single-level by construction, so `mergedInto ?? id` resolves
   * the canonical id without a recursive walk.
   */
  readonly mergedInto?: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
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
  /**
   * Include quarantined memories in the result set (P1-4). Defaults to
   * `false`: action-driving recall never returns quarantined rows. Set
   * `true` only for the validation / inspector path — never for
   * auto-recall fed back into the model.
   */
  readonly includeQuarantined?: boolean;
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
