/**
 * `InsightMemory` — the thin, read-only surface over the reflection
 * insights the consolidator synthesizes (P1-1). Insights are *derived*
 * (quarantined + `provenance: 'reflection'`), carry mandatory citations,
 * and are retrieval-ranked **below the primary facts they cite**. The
 * write + salience-management paths live in the consolidator's
 * reflection pass; this tier only lists / searches for the validation /
 * inspector path.
 *
 * Search is FTS-only — insights are a soft inspector surface, not
 * primary recall, so no embedder is wired here.
 *
 * @packageDocumentation
 */

import type { Fact, Insight, MemoryHit, SessionScope, Tracer } from '@graphorin/core';
import { QuarantinePromotionRefusedError } from '../errors/index.js';
import { detectMemoryInjection } from '../internal/injection-heuristics.js';
import { withMemorySpan } from '../internal/spans.js';
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';

/** Per-call options accepted by {@link InsightMemory.search}. */
export interface InsightSearchOptions {
  readonly topK?: number;
  /**
   * Include quarantined insights (P1-4). Defaults to `false`. Since
   * reflection-synthesized insights *always* land quarantined, set this
   * `true` to surface them for the validation / inspector path — never
   * for auto-recall fed back into the model.
   */
  readonly includeQuarantined?: boolean;
  readonly signal?: AbortSignal;
}

/** Per-call options accepted by {@link InsightMemory.list}. */
export interface InsightListOptions {
  readonly limit?: number;
  /** Include quarantined insights (validation / inspector path). */
  readonly includeQuarantined?: boolean;
}

/**
 * `InsightMemory` — list / search reflection insights. A no-op (returns
 * empty) when the storage adapter does not expose the optional
 * `insights` surface.
 *
 * @stable
 */
export class InsightMemory {
  readonly #store: MemoryStoreAdapter;
  readonly #tracer: Tracer;

  constructor(args: { store: MemoryStoreAdapter; tracer: Tracer }) {
    this.#store = args.store;
    this.#tracer = args.tracer;
  }

  /** FTS keyword search over insight text. */
  async search(
    scope: SessionScope,
    query: string,
    opts: InsightSearchOptions = {},
  ): Promise<ReadonlyArray<MemoryHit<Insight>>> {
    return withMemorySpan(
      this.#tracer,
      'memory.search.insight',
      scope,
      { 'memory.search.query_length': query.length },
      async (span) => {
        const store = this.#store.insights;
        if (store === undefined) {
          span.setAttributes({ 'memory.search.insight.count': 0 });
          return [];
        }
        const hits = await store.search(scope, query, {
          topK: opts.topK ?? 10,
          ...(opts.includeQuarantined !== undefined
            ? { includeQuarantined: opts.includeQuarantined }
            : {}),
        });
        span.setAttributes({ 'memory.search.insight.count': hits.length });
        return hits;
      },
    );
  }

  /** Most-recent insights for the scope (newest first). */
  async list(scope: SessionScope, opts: InsightListOptions = {}): Promise<ReadonlyArray<Insight>> {
    return withMemorySpan(this.#tracer, 'memory.read.insight', scope, {}, async (span) => {
      const store = this.#store.insights;
      if (store === undefined) {
        span.setAttributes({ 'memory.read.insight.count': 0 });
        return [];
      }
      const out = await store.list(scope, {
        ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
        ...(opts.includeQuarantined !== undefined
          ? { includeQuarantined: opts.includeQuarantined }
          : {}),
      });
      span.setAttributes({ 'memory.read.insight.count': out.length });
      return out;
    });
  }

  /** Lookup a single insight by id. */
  async get(id: string): Promise<Insight | null> {
    const store = this.#store.insights;
    if (store === undefined || typeof store.get !== 'function') return null;
    return store.get(id);
  }

  /**
   * Promote a quarantined insight out of quarantine (MCON-2). Mirrors
   * {@link SemanticMemory.validate}: re-derives the injection verdict from the
   * stored text and **refuses** promotion of an injection-flagged insight
   * unless an operator passes `{ force: true }` from a trusted context.
   */
  async validate(
    scope: SessionScope,
    insightId: string,
    reason?: string,
    options?: { readonly force?: boolean },
  ): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.insight',
      scope,
      { 'memory.insight.action': 'validate', 'memory.insight.insight_id': insightId },
      async (span) => {
        const store = this.#store.insights;
        if (store === undefined || typeof store.setStatus !== 'function') {
          throw new TypeError(
            '[graphorin/memory] InsightMemory.validate(...) requires a storage adapter that implements `insights.setStatus(id, status)`. ' +
              'The default `@graphorin/store-sqlite` adapter implements it; custom adapters can opt in via InsightMemoryStoreExt.',
          );
        }
        const force = options?.force === true;
        const existing = typeof store.get === 'function' ? await store.get(insightId) : null;
        if (existing !== null && !force) {
          const injection = detectMemoryInjection(existing.text);
          if (injection.flagged) {
            span.setAttributes({ 'memory.insight.validate.refused': true });
            throw new QuarantinePromotionRefusedError(insightId, injection.markers);
          }
        }
        span.setAttributes({ 'memory.insight.validate.forced': force });
        await store.setStatus(insightId, 'active', reason);
      },
    );
  }
}

/** Tie-break margin keeping a capped insight strictly below its cited fact. */
const RANK_CAP_EPSILON = 1e-6;

/**
 * Enforce the P1-1 rank ceiling: an insight may never outrank a primary
 * fact **it cites**. For each insight hit, if any fact it cites is
 * present in `factHits`, its score is lowered to strictly below that
 * cited fact's score — so concatenating the two lists and sorting by
 * score descending can never place the insight above the evidence it
 * was synthesized from. Insights whose cited facts are absent from
 * `factHits` are returned unchanged; this is a relative, not a global,
 * cap (per the execution plan: "never outrank the primary facts they
 * cite").
 *
 * Pure + deterministic — does not mutate its inputs.
 *
 * @stable
 */
export function capInsightsBelowFacts(
  factHits: ReadonlyArray<MemoryHit<Fact>>,
  insightHits: ReadonlyArray<MemoryHit<Insight>>,
): ReadonlyArray<MemoryHit<Insight>> {
  if (factHits.length === 0 || insightHits.length === 0) return insightHits;
  const factScoreById = new Map<string, number>();
  for (const hit of factHits) {
    const prev = factScoreById.get(hit.record.id);
    if (prev === undefined || hit.score > prev) factScoreById.set(hit.record.id, hit.score);
  }
  return insightHits.map((hit) => {
    let citedMax = Number.NEGATIVE_INFINITY;
    for (const id of hit.record.cites) {
      const score = factScoreById.get(id);
      if (score !== undefined && score > citedMax) citedMax = score;
    }
    // No cited fact present in the fused set, or already below it ⇒ keep.
    if (citedMax === Number.NEGATIVE_INFINITY || hit.score < citedMax) return hit;
    const capped = citedMax - RANK_CAP_EPSILON;
    return {
      ...hit,
      score: capped,
      signals: Object.freeze({ ...(hit.signals ?? {}), 'rank-cap': capped }),
    };
  });
}
