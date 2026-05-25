import type {
  EmbedderProvider,
  Fact,
  MemoryHit,
  MemoryProvenance,
  MemoryStatus,
  Sensitivity,
  SessionScope,
  Tracer,
} from '@graphorin/core';
import { md5 } from '@graphorin/core';
import type { ConflictDecision, ConflictPipeline } from '../conflict/index.js';
import { newMemoryId } from '../internal/id.js';
import { detectMemoryInjection } from '../internal/injection-heuristics.js';
import { withMemorySpan } from '../internal/spans.js';
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';
import { fuseRrf } from '../search/rrf.js';
import type { ReRanker } from '../search/types.js';

/**
 * Author-time fact payload accepted by {@link SemanticMemory.remember}.
 * The framework derives `id`, `kind: 'semantic'`, `userId`,
 * `createdAt`, `updatedAt`, `validFrom`, the optional `embedder_id`,
 * and the deduplication `hash` from this input.
 *
 * @stable
 */
export interface FactInput {
  readonly text: string;
  readonly subject?: string;
  readonly predicate?: string;
  readonly object?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly confidence?: number;
  readonly sensitivity?: Sensitivity;
  readonly validFrom?: string;
  readonly validTo?: string;
  readonly supersedes?: string;
  /**
   * Trust-provenance tag (P1-4). Writers that synthesize memory pass
   * `'extraction'` / `'reflection'` so the fact lands quarantined;
   * first-party writers pass `'user'` / `'tool'` (or omit it — absent ⇒
   * treated as first-party `active`). The `status` is *derived* from
   * this tag plus the injection heuristics; it is never author-set.
   */
  readonly provenance?: MemoryProvenance;
}

/**
 * Per-call options accepted by {@link SemanticMemory.search}.
 *
 * @stable
 */
export interface FactSearchOptions {
  readonly topK?: number;
  readonly signal?: AbortSignal;
  /** Override the per-list candidate count (default `60`). */
  readonly candidateTopK?: number;
  /**
   * Point-in-time ("as of") read. When set, only facts whose
   * bi-temporal validity interval contains this instant are returned
   * (`valid_from <= asOf < valid_to`, open-ended bounds allowed),
   * applied at the store layer to both the FTS and vector candidate
   * lists. ISO-8601. Absent ⇒ current behaviour is unchanged. P0-2.
   *
   * @stable
   */
  readonly asOf?: string;
  /**
   * Include quarantined facts in the result (P1-4). Defaults to
   * `false` — action-driving recall (`fact_search`, auto-recall) never
   * returns quarantined rows. Set `true` only for the validation /
   * inspector path that surfaces quarantined facts to a human for
   * promotion via {@link SemanticMemory.validate}.
   *
   * @stable
   */
  readonly includeQuarantined?: boolean;
  /**
   * Optional decay-aware ranking. When set, the reranker output is
   * post-multiplied by the per-fact retention curve
   * `score *= exp(-elapsedDays / tauDays)` so stale facts drop in
   * the result list without ever being hard-deleted (principle 8).
   * Requires the storage adapter to expose
   * `semantic.listForDecay?(...)` so the search can read
   * `strength` + `lastAccessedAt`; adapters without the surface
   * skip the boost silently.
   *
   * @stable
   */
  readonly decay?: {
    readonly tauDays: number;
    /** Override the wall clock (test seam). */
    readonly now?: () => number;
  };
}

/**
 * Per-call options accepted by {@link SemanticMemory.remember}. The
 * Phase 10b pipeline writes one row to `fact_conflicts` (and
 * potentially one to `conflict_check_pending`) for every invocation;
 * pass `pipeline: 'off'` to bypass the pipeline for a single call
 * (useful for one-shot data imports).
 *
 * @stable
 */
export interface FactRememberOptions {
  readonly pipeline?: 'on' | 'off';
  /** Cancellation signal forwarded to the embedder + storage layers. */
  readonly signal?: AbortSignal;
}

/**
 * Returned by {@link SemanticMemory.remember}. The `fact` is the
 * stored row (which may be the *existing* fact when the pipeline
 * dedups). The `decision` mirrors the pipeline outcome so callers can
 * distinguish silent dedups from active inserts.
 *
 * @stable
 */
export interface RememberOutcome {
  readonly fact: Fact;
  readonly decision: ConflictDecision;
}

/**
 * `SemanticMemory` — long-term factual store. Hybrid (vector + FTS5)
 * search merges the two ranked lists through the configured
 * {@link ReRanker} (default {@link RRFReranker} with `k = 60`).
 *
 * Phase 10a wrote facts straight through with MD5 deduplication;
 * Phase 10b routes every `remember(...)` call through the multi-stage
 * conflict resolution pipeline (DEC-117 / ADR-018 ext / RB-02). The
 * pipeline can be disabled per-call (`pipeline: 'off'`) or per-`Memory`
 * instance (`createMemory({ conflictPipeline: { mode: 'off' } })`).
 *
 * @stable
 */
export class SemanticMemory {
  readonly #store: MemoryStoreAdapter;
  readonly #tracer: Tracer;
  readonly #embedder: EmbedderProvider | null;
  readonly #embedderIdProvider: () => string | null;
  readonly #pipeline: ConflictPipeline | null;
  #reranker: ReRanker;

  constructor(args: {
    store: MemoryStoreAdapter;
    tracer: Tracer;
    embedder: EmbedderProvider | null;
    embedderIdProvider: () => string | null;
    reranker: ReRanker;
    conflictPipeline?: ConflictPipeline;
  }) {
    this.#store = args.store;
    this.#tracer = args.tracer;
    this.#embedder = args.embedder;
    this.#embedderIdProvider = args.embedderIdProvider;
    this.#reranker = args.reranker;
    this.#pipeline = args.conflictPipeline ?? null;
  }

  /** Replace the active reranker. Returns the previous instance. */
  setReranker(reranker: ReRanker): ReRanker {
    const previous = this.#reranker;
    this.#reranker = reranker;
    return previous;
  }

  /** Currently active reranker. */
  reranker(): ReRanker {
    return this.#reranker;
  }

  /**
   * Persist a fact. Returns the stored record. Phase 10b routes every
   * call through the multi-stage conflict resolution pipeline; the
   * legacy straight-through path is reachable per-call via
   * `{ pipeline: 'off' }` (operators may disable the pipeline globally
   * via `createMemory({ conflictPipeline: { mode: 'off' } })`).
   */
  async remember(
    scope: SessionScope,
    input: FactInput,
    options: FactRememberOptions = {},
  ): Promise<Fact> {
    const { fact } = await this.rememberWithDecision(scope, input, options);
    return fact;
  }

  /**
   * Like {@link remember} but returns the pipeline `decision` alongside
   * the stored fact. Useful for callers that need to distinguish
   * silent dedups (`decision.kind === 'dedup'`) from fresh inserts.
   *
   * @stable
   */
  async rememberWithDecision(
    scope: SessionScope,
    input: FactInput,
    options: FactRememberOptions = {},
  ): Promise<RememberOutcome> {
    return withMemorySpan(this.#tracer, 'memory.write.semantic', scope, {}, async (span) => {
      const now = new Date().toISOString();
      const text = input.text;
      // P1-4: derive the retrieval-trust status. Synthesized writes
      // (consolidator extraction / reflection) and candidates that trip
      // the offline injection heuristics land quarantined — excluded
      // from default recall until a human validates them. First-party
      // writes (user / tool / imported / unset) stay active. `status`
      // is never author-set; it is always derived here.
      const provenance = input.provenance;
      const synthesized = provenance === 'extraction' || provenance === 'reflection';
      const injection = detectMemoryInjection(text);
      const status: MemoryStatus = synthesized || injection.flagged ? 'quarantined' : 'active';
      const fact: Fact = {
        id: newMemoryId('fact'),
        kind: 'semantic',
        userId: scope.userId,
        ...(scope.sessionId !== undefined ? { sessionId: scope.sessionId } : {}),
        ...(scope.agentId !== undefined ? { agentId: scope.agentId } : {}),
        sensitivity: input.sensitivity ?? 'internal',
        text,
        ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
        ...(input.tags !== undefined ? { tags: Object.freeze([...input.tags]) } : {}),
        ...(input.validFrom !== undefined ? { validFrom: input.validFrom } : { validFrom: now }),
        ...(input.validTo !== undefined ? { validTo: input.validTo } : {}),
        ...(input.supersedes !== undefined ? { supersedes: input.supersedes } : {}),
        ...(provenance !== undefined ? { provenance } : {}),
        status,
        createdAt: now,
        updatedAt: now,
      };
      const embedderId = this.#embedderIdProvider();
      const embedder = this.#embedder;
      const pipelineEnabled = this.#pipeline !== null && (options.pipeline ?? 'on') === 'on';
      const decision: ConflictDecision =
        pipelineEnabled && this.#pipeline !== null
          ? await this.#pipeline.run(
              {
                store: this.#store,
                tracer: this.#tracer,
                embedder,
                embedderId,
                ...(options.signal !== undefined ? { signal: options.signal } : {}),
              },
              fact,
            )
          : { kind: 'admit', stage: 'exact-dedup', reason: 'pipeline-skipped' };

      span.setAttributes({
        'memory.semantic.text_length': text.length,
        'memory.semantic.hash': md5(text),
        'memory.semantic.pipeline.decision': decision.kind,
        'memory.semantic.pipeline.stage': decision.stage,
        'memory.semantic.pipeline.enabled': pipelineEnabled,
        'memory.semantic.status': status,
        ...(provenance !== undefined ? { 'memory.semantic.provenance': provenance } : {}),
        'memory.semantic.injection_flagged': injection.flagged,
        ...(injection.flagged
          ? { 'memory.semantic.injection_markers': injection.markers.join(',') }
          : {}),
      });

      switch (decision.kind) {
        case 'admit':
        case 'pending': {
          await this.#commitFact(fact, embedder, embedderId);
          return { fact, decision };
        }
        case 'dedup': {
          const existing = await this.#fetchExisting(decision.existingId);
          return { fact: existing ?? fact, decision };
        }
        case 'supersede': {
          await this.#commitFact(fact, embedder, embedderId);
          await this.#store.semantic.supersede(decision.existingId, fact, decision.reason);
          return { fact, decision };
        }
      }
    });
  }

  async #commitFact(
    fact: Fact,
    embedder: EmbedderProvider | null,
    embedderId: string | null,
  ): Promise<void> {
    const adapterSupportsEmbeddedWrite =
      typeof this.#store.semantic.rememberWithEmbedding === 'function';
    const hasEmbeddingPath =
      embedder !== null && embedderId !== null && adapterSupportsEmbeddedWrite;
    if (hasEmbeddingPath) {
      const [vector] = await embedder.embed([fact.text]);
      if (vector !== undefined && this.#store.semantic.rememberWithEmbedding !== undefined) {
        await this.#store.semantic.rememberWithEmbedding(fact, {
          embedding: { embedderId, vector },
        });
        return;
      }
    }
    await this.#store.semantic.remember(fact);
  }

  async #fetchExisting(factId: string): Promise<Fact | null> {
    if (typeof this.#store.semantic.get !== 'function') return null;
    return this.#store.semantic.get(factId);
  }

  /** Hybrid (vector + FTS5) search merged through the configured reranker. */
  async search(
    scope: SessionScope,
    query: string,
    opts: FactSearchOptions = {},
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    return withMemorySpan(
      this.#tracer,
      'memory.search.semantic',
      scope,
      { 'memory.search.query_length': query.length },
      async (span) => {
        const candidateTopK = opts.candidateTopK ?? 60;
        const finalTopK = opts.topK ?? 10;
        const ftsHits = await this.#store.semantic.search(scope, {
          query,
          topK: candidateTopK,
          ...(opts.asOf !== undefined ? { asOf: opts.asOf } : {}),
          ...(opts.includeQuarantined === true ? { includeQuarantined: true } : {}),
          ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
        });
        const vectorHits = await this.#tryVectorSearch(
          scope,
          query,
          candidateTopK,
          opts.asOf,
          opts.includeQuarantined,
        );
        const lists: ReadonlyArray<ReadonlyArray<MemoryHit<Fact>>> =
          vectorHits.length === 0 ? [ftsHits] : [ftsHits, vectorHits];
        const fused = await this.#reranker.rerank(query, lists, {
          topK: finalTopK,
          ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
        });
        const ranked = await this.#applyDecay(scope, fused, opts.decay);
        span.setAttributes({
          'memory.search.semantic.fts_count': ftsHits.length,
          'memory.search.semantic.vector_count': vectorHits.length,
          'memory.search.semantic.final_count': ranked.length,
          'memory.search.semantic.reranker_id': this.#reranker.id,
          'memory.search.semantic.decay_applied': opts.decay !== undefined,
          ...(opts.asOf !== undefined ? { 'memory.search.semantic.as_of': opts.asOf } : {}),
          ...(opts.includeQuarantined === true
            ? { 'memory.search.semantic.include_quarantined': true }
            : {}),
        });
        return ranked;
      },
    );
  }

  /** Lookup a single fact by id. Returns `null` for soft-deleted / missing. */
  async get(scope: SessionScope, factId: string): Promise<Fact | null> {
    return withMemorySpan(
      this.#tracer,
      'memory.read.semantic',
      scope,
      { 'memory.semantic.fact_id': factId },
      async (span) => {
        if (typeof this.#store.semantic.get !== 'function') {
          throw new TypeError(
            '[graphorin/memory] SemanticMemory.get(...) requires a storage adapter that implements `semantic.get(id)`. ' +
              'The default `@graphorin/store-sqlite` adapter implements it; custom adapters can opt in via SemanticMemoryStoreExt.',
          );
        }
        const fact = await this.#store.semantic.get(factId);
        span.setAttributes({ 'memory.read.semantic.found': fact !== null });
        return fact;
      },
    );
  }

  /**
   * Return the full bi-temporal supersede chain that `factId` belongs
   * to, oldest → newest, including superseded / soft-deleted rows so
   * callers can answer "how did this fact change over time". Requires
   * a storage adapter that implements
   * `SemanticMemoryStoreExt.historyOf(...)` — the default
   * `@graphorin/store-sqlite` adapter wires this through. P0-2.
   *
   * @stable
   */
  async history(scope: SessionScope, factId: string): Promise<ReadonlyArray<Fact>> {
    return withMemorySpan(
      this.#tracer,
      'memory.read.semantic',
      scope,
      { 'memory.semantic.action': 'history', 'memory.semantic.fact_id': factId },
      async (span) => {
        if (typeof this.#store.semantic.historyOf !== 'function') {
          throw new TypeError(
            '[graphorin/memory] SemanticMemory.history(...) requires a storage adapter that implements `semantic.historyOf(scope, id)`. ' +
              'The default `@graphorin/store-sqlite` adapter implements it; custom adapters can opt in via SemanticMemoryStoreExt.',
          );
        }
        const chain = await this.#store.semantic.historyOf(scope, factId);
        span.setAttributes({ 'memory.read.semantic.history_length': chain.length });
        return chain;
      },
    );
  }

  /**
   * Promote a quarantined fact to `active` (P1-4). The validation path
   * that admits a synthesized / injection-flagged memory into
   * action-driving recall once a human (or trusted non-agent caller)
   * has reviewed it. Writes a `memory_history` audit row. Requires a
   * storage adapter that implements
   * `SemanticMemoryStoreExt.setStatus(...)` — the default
   * `@graphorin/store-sqlite` adapter wires this through.
   *
   * @stable
   */
  async validate(scope: SessionScope, factId: string, reason?: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.semantic',
      scope,
      { 'memory.semantic.action': 'validate', 'memory.semantic.fact_id': factId },
      async () => {
        if (typeof this.#store.semantic.setStatus !== 'function') {
          throw new TypeError(
            '[graphorin/memory] SemanticMemory.validate(...) requires a storage adapter that implements `semantic.setStatus(id, status)`. ' +
              'The default `@graphorin/store-sqlite` adapter implements it; custom adapters can opt in via SemanticMemoryStoreExt.',
          );
        }
        await this.#store.semantic.setStatus(factId, 'active', reason);
      },
    );
  }

  /** Mark `oldId` superseded by a new fact. Returns the new record. */
  async supersede(
    scope: SessionScope,
    oldId: string,
    newInput: FactInput,
    reason?: string,
  ): Promise<{ readonly old: string; readonly new: Fact }> {
    return withMemorySpan(
      this.#tracer,
      'memory.write.semantic',
      scope,
      { 'memory.semantic.action': 'supersede' },
      async () => {
        // Bypass the conflict pipeline — the explicit supersede call
        // is the user's authoritative decision; a second pipeline
        // pass would race with itself (the new fact is by definition
        // a near-dup of the old one) and could silently reroute the
        // write into a `dedup` outcome.
        const newFact = await this.remember(
          scope,
          { ...newInput, supersedes: oldId },
          { pipeline: 'off' },
        );
        await this.#store.semantic.supersede(oldId, newFact, reason);
        return { old: oldId, new: newFact };
      },
    );
  }

  /** Soft-delete a fact (kept for replay; never hard-deleted). */
  async forget(scope: SessionScope, factId: string, reason?: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.semantic',
      scope,
      { 'memory.semantic.action': 'forget', 'memory.semantic.fact_id': factId },
      async () => {
        await this.#store.semantic.forget(factId, reason);
      },
    );
  }

  /**
   * Hard-delete a fact (GDPR path). Distinct from {@link forget}: the
   * record is removed from storage entirely instead of soft-archived.
   * Requires a storage adapter that implements
   * `SemanticMemoryStoreExt.purge(...)` — the default
   * `@graphorin/store-sqlite` adapter wires this through.
   */
  async purge(scope: SessionScope, factId: string, reason?: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.semantic',
      scope,
      { 'memory.semantic.action': 'purge', 'memory.semantic.fact_id': factId },
      async () => {
        if (typeof this.#store.semantic.purge !== 'function') {
          throw new TypeError(
            '[graphorin/memory] SemanticMemory.purge(...) requires a storage adapter that implements `semantic.purge(id)`. ' +
              'For storage adapters without GDPR-grade hard-delete, prefer `SemanticMemory.forget(...)`.',
          );
        }
        await this.#store.semantic.purge(factId, reason);
      },
    );
  }

  /** Fuse multiple ranked lists outside of a `search()` call. */
  async fuse(
    query: string,
    lists: ReadonlyArray<ReadonlyArray<MemoryHit<Fact>>>,
    options: { topK?: number; signal?: AbortSignal } = {},
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    return this.#reranker.rerank(query, lists, options);
  }

  /** Pure-fusion helper — exposed for callers that already collected results. */
  static fuseRrf<TRecord extends Fact>(
    lists: ReadonlyArray<ReadonlyArray<MemoryHit<TRecord>>>,
    k = 60,
  ): ReadonlyArray<MemoryHit<TRecord>> {
    return fuseRrf(lists, k);
  }

  async #tryVectorSearch(
    scope: SessionScope,
    query: string,
    topK: number,
    asOf?: string,
    includeQuarantined?: boolean,
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    const embedderId = this.#embedderIdProvider();
    if (
      this.#embedder === null ||
      embedderId === null ||
      typeof this.#store.semantic.searchVector !== 'function'
    ) {
      return [];
    }
    const [vector] = await this.#embedder.embed([query]);
    if (vector === undefined) return [];
    return this.#store.semantic.searchVector(
      scope,
      vector,
      embedderId,
      topK,
      asOf,
      includeQuarantined,
    );
  }

  async #applyDecay(
    scope: SessionScope,
    hits: ReadonlyArray<MemoryHit<Fact>>,
    decay: FactSearchOptions['decay'],
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    if (decay === undefined || hits.length === 0) return hits;
    if (typeof this.#store.semantic.listForDecay !== 'function') return hits;
    const rows = await this.#store.semantic.listForDecay(scope, 1000);
    if (rows.length === 0) return hits;
    const signals = new Map(
      rows.map((row) => [
        row.id,
        {
          strength: row.strength,
          lastAccessedAt: row.lastAccessedAt,
          createdAt: row.createdAt,
        },
      ]),
    );
    const now = (decay.now ?? Date.now)();
    const tauMs = Math.max(1, decay.tauDays) * 24 * 60 * 60 * 1000;
    const out = hits.map((hit) => {
      const sig = signals.get(hit.record.id);
      if (sig === undefined) return hit;
      const reference = sig.lastAccessedAt ?? sig.createdAt;
      const elapsed = Math.max(0, now - reference);
      const retention = Math.exp(-elapsed / (tauMs * Math.max(0.5, sig.strength)));
      return { ...hit, score: hit.score * retention };
    });
    const sorted = [...out].sort((a, b) => b.score - a.score);
    return Object.freeze(sorted);
  }
}
