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
import { QuarantinePromotionRefusedError } from '../errors/index.js';
import type { EntityResolver } from '../graph/entity-resolver.js';
import { contextualize } from '../internal/contextualize.js';
import { newMemoryId } from '../internal/id.js';
import { detectMemoryInjection } from '../internal/injection-heuristics.js';
import { withMemorySpan } from '../internal/spans.js';
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';
import { explainRecall } from '../search/explain.js';
import {
  DEFAULT_MAX_ITERATIONS,
  type IterativeRetrievalResult,
  type RetrievalGrader,
  runIterativeRetrieval,
} from '../search/iterative.js';
import type { QueryTransformer } from '../search/query-transform.js';
import { fuseRrf, fuseWeighted, WeightedRRFReranker } from '../search/rrf.js';
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
  /**
   * Importance hint in `[0, 1]` (X-1 / MCON-12). Feeds the multi-signal
   * salience score that orders decay archiving and capacity eviction —
   * higher importance ⇒ evicted later. Values are clamped to `[0, 1]`;
   * non-finite values are dropped. The consolidator's extraction pass
   * fills this from the model's per-fact 1–10 rating
   * (`normalizeImportance`); absent ⇒ the neutral midpoint at scoring
   * time.
   */
  readonly importance?: number;
}

/**
 * Per-list weights for {@link FusionStrategy} `'weighted'` fusion (X-2),
 * keyed by retriever *kind* rather than position so they survive the
 * P2-3 multi-query fan-out (which appends extra FTS / vector candidate
 * lists). Each defaults to the neutral `1` (≡ RRF). The HyDE list is a
 * vector list and takes the `vector` weight.
 *
 * @stable
 */
export interface FusionWeights {
  /** Weight applied to every FTS5 (lexical) candidate list. Default `1`. */
  readonly fts?: number;
  /** Weight applied to every vector (incl. HyDE) candidate list. Default `1`. */
  readonly vector?: number;
}

/**
 * Score-fusion strategy for {@link SemanticMemory.search} (X-2).
 *
 * - `'rrf'` (the default when `fusion` is omitted) fuses the candidate
 *   lists through the configured reranker — the zero-tuning
 *   {@link RRFReranker} unless one was overridden.
 * - `'weighted'` fuses through {@link WeightedRRFReranker}, scaling each
 *   list's reciprocal-rank contribution by its {@link FusionWeights}, for
 *   callers who have calibrated retriever reliability against labels (the
 *   P0-1 eval harness). At equal weights it reproduces RRF.
 *
 * @stable
 */
export type FusionStrategy =
  | { readonly strategy: 'rrf' }
  | {
      readonly strategy: 'weighted';
      readonly weights: FusionWeights;
      /** Override the RRF constant for the weighted fuse. Default `60`. */
      readonly k?: number;
    };

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
   * Any-of tags filter (MRET-4). A fact matches when it carries at
   * least one of the requested tags; untagged facts never match.
   * Applied in-store on the FTS leg and as a record-level filter on
   * the fused result so every candidate leg (vector / HyDE / graph)
   * obeys it.
   */
  readonly tags?: ReadonlyArray<string>;
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
  /**
   * Multi-query / RAG-Fusion (P2-3). When set to `N > 1` *and* a query
   * transformer is configured (`createMemory({ queryTransform })`), the
   * query is fanned into up to `N - 1` reworded variants via one cheap
   * LLM call; each variant is retrieved (FTS + vector) and **all** lists
   * are fused through the existing RRF reranker — recovering memories
   * whose stored wording differs from the user's phrasing. `N` bounds
   * the *total* query strings, including the original. Offline (no
   * transformer, or `N <= 1`) this is a **silent no-op**: search stays
   * single-shot and makes no provider call. Opt-in + retrieval-heavy, so
   * reserve it for deliberate recall rather than every search.
   *
   * @stable
   */
  readonly multiQuery?: number;
  /**
   * HyDE — Hypothetical Document Embeddings (arXiv:2212.10496), P2-3.
   * When `true` *and* both a query transformer and an embedder are
   * configured, generate a short hypothetical answer, embed it, and fuse
   * its vector neighbours into the result. Helps short / ambiguous
   * queries but adds a generate + embed round-trip and can drift — hence
   * opt-in. With no transformer (or no embedder) this is a silent no-op
   * and no provider call is made.
   *
   * @stable
   */
  readonly hyde?: boolean;
  /**
   * Score-fusion strategy (X-2). Omitted (the default) ⇒ RRF via the
   * configured reranker — behaviour is unchanged. `{ strategy:
   * 'weighted', weights }` fuses through {@link WeightedRRFReranker},
   * up-/down-weighting the FTS vs vector candidate lists per
   * {@link FusionWeights}; reserve it for callers who have calibrated the
   * weights against labels (the P0-1 eval harness). At equal weights it
   * reproduces RRF.
   *
   * @stable
   */
  readonly fusion?: FusionStrategy;
  /**
   * One-hop graph expansion (P2-1). With `1` *and* a graph-capable
   * storage adapter (`store.graph`), the facts retrieved by the lexical /
   * vector candidate pass are treated as seeds: facts sharing a canonical
   * entity (subject / object) are fetched via a recursive CTE and fused
   * in as an extra candidate list before rerank — surfacing connected
   * facts the query never matched directly ("what did the person I met in
   * Tbilisi recommend?"). `0` (the default) or a graph-less adapter ⇒ a
   * silent no-op; recall is unchanged. Opt-in + retrieval-heavy.
   *
   * @stable
   */
  readonly expandHops?: 0 | 1;
}

/**
 * Per-call options for {@link SemanticMemory.searchIterative} (P2-4) —
 * the gated grade-then-reformulate loop. Extends {@link FactSearchOptions}
 * (every base option applies to each retrieval pass); `topK` doubles as
 * the cap on the accumulated result count.
 *
 * @stable
 */
export interface IterativeSearchOptions extends FactSearchOptions {
  /**
   * Total-pass cap, clamped to `[1, 5]`. Omitted ⇒ the facade-configured
   * default (`createMemory({ iterativeRetrieval: { maxIterations } })`)
   * or `3`.
   */
  readonly maxIterations?: number;
  /**
   * Skip the heuristic difficulty gate and force the loop (still capped
   * and still a no-op without a grader). For deliberate "deep recall"
   * requests and tests.
   */
  readonly forceHard?: boolean;
}

/**
 * Outcome of {@link SemanticMemory.searchIterative}. Beyond the ranked
 * `hits`, `sufficient` / `abstained` tell the caller whether the memory
 * actually answered the query — `abstained: true` means it should say so
 * rather than confabulate.
 *
 * @stable
 */
export type IterativeRecallResult = IterativeRetrievalResult<MemoryHit<Fact>>;

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
  /**
   * Precomputed contextual-retrieval index text (P1-3, advanced). When
   * supplied it overrides the instance's `'late-chunk'` computation: the
   * embedding is computed from — and the FTS row indexed against — this
   * text, while the canonical `text` is stored unchanged. The background
   * consolidator passes this in its `'llm'` mode (the one place an LLM is
   * allowed to write the situating context); first-party callers normally
   * omit it and rely on the offline late-chunk default.
   */
  readonly indexText?: string;
  /**
   * Auto-promotion policy (MCON-2). When `true`, a *synthesized* write
   * (consolidator extraction) that is **clean** by the injection heuristics is
   * stored `active` instead of quarantined. Injection-flagged writes always
   * stay quarantined — the security gate is preserved. Off by default; the
   * consolidator passes it only when the operator opts in via
   * `autoPromoteExtraction`. No effect on non-synthesized writes.
   */
  readonly autoPromoteSynthesized?: boolean;
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
  /**
   * Why this write landed quarantined, if it did (P1-4 / MRET-3).
   * `'injection'` — the offline injection heuristics flagged the text
   * (a memory-poisoning candidate). `'synthesized'` — a consolidator /
   * reflection / induction write awaiting validation. Absent when the
   * fact is `active` or when a dedup returned a pre-existing row.
   */
  readonly quarantineReason?: 'injection' | 'synthesized';
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
  readonly #contextualMode: 'off' | 'late-chunk';
  readonly #queryTransformer: QueryTransformer | null;
  readonly #entityResolver: EntityResolver | null;
  readonly #grader: RetrievalGrader | null;
  readonly #iterativeMaxIterations: number;
  #reranker: ReRanker;

  constructor(args: {
    store: MemoryStoreAdapter;
    tracer: Tracer;
    embedder: EmbedderProvider | null;
    embedderIdProvider: () => string | null;
    reranker: ReRanker;
    conflictPipeline?: ConflictPipeline;
    /**
     * Query transformer for multi-query / HyDE retrieval (P2-3). When
     * supplied, `search(..., { multiQuery })` / `{ hyde }` opt into one
     * cheap LLM call to rewrite / hypothesize the query; omitted (the
     * default) ⇒ those options are silent no-ops and search stays
     * offline + single-shot.
     */
    queryTransformer?: QueryTransformer;
    /**
     * Contextual-retrieval mode for the write path (P1-3). `'late-chunk'`
     * (default) prepends a deterministic situating context to the text
     * that is embedded + FTS-indexed, leaving the canonical `text`
     * untouched; `'off'` indexes the bare text. The hot write path never
     * makes an LLM call — the `'llm'` enrichment is confined to the
     * background consolidator, which supplies a precomputed `indexText`.
     */
    contextualRetrieval?: 'off' | 'late-chunk';
    /**
     * Entity resolver for the relation graph (P2-1). When supplied,
     * `remember(...)` resolves a fact's subject / object to canonical
     * entities and links them, enabling `search(..., { expandHops: 1 })`.
     * Omitted (the default) ⇒ writes carry s/p/o but form no entity
     * links, and the write path stays offline + unchanged.
     */
    entityResolver?: EntityResolver;
    /**
     * Retrieval grader for the gated iterative loop (P2-4). When
     * supplied, `searchIterative(...)` can grade a retrieved set and
     * reformulate on hard queries; omitted (the default) ⇒
     * `searchIterative` runs a single, difficulty-gated pass and makes no
     * provider call.
     */
    grader?: RetrievalGrader;
    /** Default total-pass cap for `searchIterative`. Default 3. */
    iterativeMaxIterations?: number;
  }) {
    this.#store = args.store;
    this.#tracer = args.tracer;
    this.#embedder = args.embedder;
    this.#embedderIdProvider = args.embedderIdProvider;
    this.#reranker = args.reranker;
    this.#pipeline = args.conflictPipeline ?? null;
    this.#contextualMode = args.contextualRetrieval ?? 'late-chunk';
    this.#queryTransformer = args.queryTransformer ?? null;
    this.#entityResolver = args.entityResolver ?? null;
    this.#grader = args.grader ?? null;
    this.#iterativeMaxIterations = args.iterativeMaxIterations ?? DEFAULT_MAX_ITERATIONS;
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
      const synthesized =
        provenance === 'extraction' || provenance === 'reflection' || provenance === 'induction';
      const injection = detectMemoryInjection(text);
      // MCON-2 auto-promotion: an opted-in, injection-clean synthesized write is
      // admitted `active`. Injection-flagged writes always stay quarantined.
      const autoPromote = options.autoPromoteSynthesized === true;
      const status: MemoryStatus = injection.flagged
        ? 'quarantined'
        : synthesized && !autoPromote
          ? 'quarantined'
          : 'active';
      // MRET-3: surface *why* a fresh write was quarantined so callers
      // (the fact_remember tool, harnesses) can tell an injection-flagged
      // poison candidate apart from a synthesized-but-clean consolidator
      // write. Injection takes precedence — it is the security-relevant
      // reason and gates promotion in validate().
      const quarantineReason: 'injection' | 'synthesized' | undefined =
        status === 'quarantined' ? (injection.flagged ? 'injection' : 'synthesized') : undefined;
      const fact: Fact = {
        id: newMemoryId('fact'),
        kind: 'semantic',
        userId: scope.userId,
        ...(scope.sessionId !== undefined ? { sessionId: scope.sessionId } : {}),
        ...(scope.agentId !== undefined ? { agentId: scope.agentId } : {}),
        sensitivity: input.sensitivity ?? 'internal',
        text,
        // P2-1: carry the s/p/o triple onto the persisted fact (it used to
        // be dropped here, surviving only in the late-chunk index text).
        // This is what activates the relation-graph substrate.
        ...(input.subject !== undefined ? { subject: input.subject } : {}),
        ...(input.predicate !== undefined ? { predicate: input.predicate } : {}),
        ...(input.object !== undefined ? { object: input.object } : {}),
        ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
        // X-1 / MCON-12: the importance hint that drives salience-ordered
        // forgetting. Clamped to [0, 1]; non-finite ⇒ unscored.
        ...(typeof input.importance === 'number' && Number.isFinite(input.importance)
          ? { importance: Math.min(1, Math.max(0, input.importance)) }
          : {}),
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
      // P1-3: the text that is embedded + FTS-indexed. A caller-supplied
      // `indexText` (the consolidator's `'llm'` mode) wins; otherwise the
      // instance mode decides between the bare text (`'off'`) and the
      // offline late-chunk prefix derived from the *author-supplied*
      // signals on `input` (entities / timeframe / topics). The canonical
      // `fact.text` persisted below is never altered.
      const indexText = this.#resolveIndexText(input, fact.text, options.indexText);
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
        'memory.semantic.contextualized': indexText !== text,
        ...(provenance !== undefined ? { 'memory.semantic.provenance': provenance } : {}),
        'memory.semantic.injection_flagged': injection.flagged,
        ...(injection.flagged
          ? { 'memory.semantic.injection_markers': injection.markers.join(',') }
          : {}),
      });

      const reasonField = quarantineReason !== undefined ? { quarantineReason } : {};
      switch (decision.kind) {
        case 'admit':
        case 'pending': {
          await this.#commitFact(fact, embedder, embedderId, indexText);
          await this.#linkEntities(scope, fact, options.signal);
          return { fact, decision, ...reasonField };
        }
        case 'dedup': {
          const existing = await this.#fetchExisting(decision.existingId);
          // The candidate was never committed; the existing row's own
          // status is authoritative, so do not attach the candidate's
          // quarantine reason here.
          return { fact: existing ?? fact, decision };
        }
        case 'supersede': {
          await this.#commitFact(fact, embedder, embedderId, indexText);
          await this.#store.semantic.supersede(decision.existingId, fact, decision.reason);
          await this.#linkEntities(scope, fact, options.signal);
          return { fact, decision, ...reasonField };
        }
      }
    });
  }

  /**
   * Resolve the contextual-retrieval index text (P1-3). A caller
   * override (the consolidator's `'llm'` mode) takes precedence; then
   * the instance mode decides. Late-chunk derives the situating context
   * from the *author-supplied* signals on `input` (so an extraction's
   * subject/predicate/object survive even though the persisted `Fact`
   * drops them) and never from framework-defaulted fields, so a plain
   * `remember({ text })` write returns the canonical text unchanged.
   */
  #resolveIndexText(input: FactInput, canonicalText: string, override?: string): string {
    if (override !== undefined) return override;
    if (this.#contextualMode === 'off') return canonicalText;
    return contextualize({
      text: canonicalText,
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.predicate !== undefined ? { predicate: input.predicate } : {}),
      ...(input.object !== undefined ? { object: input.object } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.validFrom !== undefined ? { validFrom: input.validFrom } : {}),
    });
  }

  async #commitFact(
    fact: Fact,
    embedder: EmbedderProvider | null,
    embedderId: string | null,
    indexText: string,
  ): Promise<void> {
    const adapterSupportsEmbeddedWrite =
      typeof this.#store.semantic.rememberWithEmbedding === 'function';
    const contextualized = indexText !== fact.text;
    const hasEmbeddingPath =
      embedder !== null && embedderId !== null && adapterSupportsEmbeddedWrite;
    if (hasEmbeddingPath) {
      // Embed the *contextual* text so the vector surface agrees with the
      // FTS index; the persisted `fact.text` stays canonical (P1-3).
      const [vector] = await embedder.embed([indexText]);
      if (vector !== undefined && this.#store.semantic.rememberWithEmbedding !== undefined) {
        await this.#store.semantic.rememberWithEmbedding(fact, {
          embedding: { embedderId, vector },
          ...(contextualized ? { indexText } : {}),
        });
        return;
      }
    }
    // No embedder, but contextualization still needs to reach the lexical
    // index — route through the extended write when the adapter supports
    // it. Plain (non-contextualized) writes keep the canonical fast path.
    if (
      contextualized &&
      adapterSupportsEmbeddedWrite &&
      this.#store.semantic.rememberWithEmbedding !== undefined
    ) {
      await this.#store.semantic.rememberWithEmbedding(fact, { indexText });
      return;
    }
    await this.#store.semantic.remember(fact);
  }

  async #fetchExisting(factId: string): Promise<Fact | null> {
    if (typeof this.#store.semantic.get !== 'function') return null;
    return this.#store.semantic.get(factId);
  }

  /**
   * P2-1: resolve the fact's subject / object to canonical entities and
   * link them so one-hop expansion can traverse this fact. A no-op when
   * no resolver is configured (the default) or the fact has no s/p/o, and
   * resilient — a resolution failure never breaks the write that just
   * committed.
   */
  async #linkEntities(scope: SessionScope, fact: Fact, signal?: AbortSignal): Promise<void> {
    if (this.#entityResolver === null) return;
    if (fact.subject === undefined && fact.object === undefined) return;
    try {
      await this.#entityResolver.linkFact(scope, fact, {
        ...(signal !== undefined ? { signal } : {}),
      });
    } catch {
      // Graph linking is a soft enrichment — never fail a committed write.
    }
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
        // X-2: when weighted fusion is opted-in, each candidate list is
        // weighted by its *kind* (FTS vs vector) so the weights survive
        // the P2-3 fan-out below; otherwise `listWeights` is unused and
        // fusion runs through the configured reranker (RRF by default).
        const weighted =
          opts.fusion !== undefined && opts.fusion.strategy === 'weighted' ? opts.fusion : null;
        const wFts = weighted?.weights.fts ?? 1;
        const wVector = weighted?.weights.vector ?? 1;
        // P2-3: fan the query into reworded variants when opted-in *and*
        // a transformer is configured; otherwise this is just `[query]`
        // (single-shot, no provider call — the offline default).
        const queries = await this.#expandQueries(query, opts);
        const lists: Array<ReadonlyArray<MemoryHit<Fact>>> = [];
        const listWeights: number[] = [];
        let primaryFtsCount = 0;
        let primaryVectorCount = 0;
        let isPrimary = true;
        for (const q of queries) {
          const ftsHits = await this.#store.semantic.search(scope, {
            query: q,
            topK: candidateTopK,
            ...(opts.asOf !== undefined ? { asOf: opts.asOf } : {}),
            // MRET-4: in-store any-of tags predicate on the FTS leg.
            ...(opts.tags !== undefined && opts.tags.length > 0 ? { tags: opts.tags } : {}),
            ...(opts.includeQuarantined === true ? { includeQuarantined: true } : {}),
            ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
          });
          lists.push(ftsHits);
          listWeights.push(wFts);
          const vectorHits = await this.#tryVectorSearch(
            scope,
            q,
            candidateTopK,
            opts.asOf,
            opts.includeQuarantined,
          );
          if (vectorHits.length > 0) {
            lists.push(vectorHits);
            listWeights.push(wVector);
          }
          if (isPrimary) {
            primaryFtsCount = ftsHits.length;
            primaryVectorCount = vectorHits.length;
            isPrimary = false;
          }
        }
        // P2-3 HyDE: embed a hypothetical answer and fuse its neighbours
        // (a vector list ⇒ it takes the `vector` weight).
        const hydeHits = await this.#tryHyde(scope, query, opts, candidateTopK);
        if (hydeHits.length > 0) {
          lists.push(hydeHits);
          listWeights.push(wVector);
        }
        // P2-1: one-hop graph expansion — seed on the candidates gathered
        // so far and fuse in facts that share a canonical entity (a third
        // candidate kind ⇒ neutral fusion weight). A no-op without
        // `expandHops` / a graph adapter.
        const graphHits = await this.#tryExpandHops(scope, lists, opts, candidateTopK);
        if (graphHits.length > 0) {
          lists.push(graphHits);
          listWeights.push(1);
        }
        // X-2: weighted fusion runs through a per-call WeightedRRFReranker
        // built from the per-list weights; the default stays the
        // configured reranker so behaviour is unchanged when `fusion` is
        // omitted.
        const reranker: ReRanker =
          weighted !== null
            ? new WeightedRRFReranker({
                weights: listWeights,
                ...(weighted.k !== undefined ? { k: weighted.k } : {}),
              })
            : this.#reranker;
        const fused = await reranker.rerank(query, lists, {
          topK: finalTopK,
          ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
        });
        const decayed = await this.#applyDecay(scope, fused, opts.decay);
        // MRET-4: the vector / HyDE / graph legs have no store-level tags
        // predicate — enforce the any-of filter on the fused records so
        // every leg obeys it.
        const ranked =
          opts.tags !== undefined && opts.tags.length > 0
            ? decayed.filter((h) => {
                const recordTags = h.record.tags;
                if (recordTags === undefined || recordTags.length === 0) return false;
                return opts.tags?.some((t) => recordTags.includes(t)) === true;
              })
            : decayed;
        // MRET-7: recall reinforces the recalled facts — stamp
        // last-accessed + bump strength so "recently accessed facts decay
        // slower" actually holds. Bookkeeping only: a failure here must
        // never break the read path.
        if (ranked.length > 0 && typeof this.#store.semantic.markAccessed === 'function') {
          try {
            await this.#store.semantic.markAccessed(ranked.map((h) => h.record.id));
          } catch {
            // Best-effort: decay reinforcement is advisory.
          }
        }
        const explanation = explainRecall(ranked, {
          query,
          rerankerId: reranker.id,
        });
        span.setAttributes({
          // `fts_count` / `vector_count` report the *original* query's
          // candidate lists, so the single-shot default reads exactly as
          // before; `query_count` (≥1) and `hyde_applied` cover the
          // P2-3 fan-out.
          'memory.search.semantic.fts_count': primaryFtsCount,
          'memory.search.semantic.vector_count': primaryVectorCount,
          'memory.search.semantic.final_count': ranked.length,
          'memory.search.semantic.reranker_id': reranker.id,
          'memory.search.semantic.decay_applied': opts.decay !== undefined,
          'memory.search.semantic.query_count': queries.length,
          'memory.search.semantic.hyde_applied': hydeHits.length > 0,
          'memory.search.semantic.expand_hops': opts.expandHops ?? 0,
          'memory.search.semantic.graph_count': graphHits.length,
          // X-3: per-signal recall explanation (ids + scores + signals,
          // no query text — the query is surfaced only as `query_length`
          // above to keep traces free of recall content).
          'memory.search.semantic.explain': JSON.stringify(explanation.results),
          ...(opts.asOf !== undefined ? { 'memory.search.semantic.as_of': opts.asOf } : {}),
          ...(opts.includeQuarantined === true
            ? { 'memory.search.semantic.include_quarantined': true }
            : {}),
        });
        return ranked;
      },
    );
  }

  /**
   * Gated, iterative ("deep") recall for hard queries (P2-4). A cheap
   * local heuristic ({@link assessQueryDifficulty}) decides whether the
   * query is even a loop candidate; simple lookups take exactly one
   * {@link search} pass and make no provider call. For a query judged
   * hard *and* with a grader configured
   * (`createMemory({ iterativeRetrieval })`), the retrieved set is graded
   * for sufficiency and, when weak, the query is reformulated and
   * retrieved again — **widening to one-hop graph expansion**
   * (`expandHops: 1`) on each reformulation pass — up to `maxIterations`
   * (hard-capped at 5). When still insufficient it returns
   * `abstained: true` so the caller can decline to answer instead of
   * confabulating.
   *
   * Without a grader (the offline default) this degrades to a single,
   * difficulty-gated `search` and never calls a provider.
   *
   * @stable
   */
  async searchIterative(
    scope: SessionScope,
    query: string,
    opts: IterativeSearchOptions = {},
  ): Promise<IterativeRecallResult> {
    // Reuse the `memory.search.semantic` span type (the inner per-pass
    // searches nest under it); iterative-specific data is namespaced under
    // the `…iterative.*` attribute prefix so no new core SpanType is
    // needed and P2-4 stays memory-only.
    return withMemorySpan(
      this.#tracer,
      'memory.search.semantic',
      scope,
      { 'memory.search.query_length': query.length },
      async (span) => {
        const result = await runIterativeRetrieval<MemoryHit<Fact>>(
          query,
          {
            // `maxIterations` / `forceHard` ride along harmlessly (search
            // ignores unknown keys); `expandHops: 1` widens recall to the
            // P2-1 graph on reformulation passes, and the per-pass signal
            // overrides any inherited one.
            retrieve: (q, widen, signal) =>
              this.search(scope, q, {
                ...opts,
                ...(widen ? { expandHops: 1 } : {}),
                ...(signal !== undefined ? { signal } : {}),
              }),
            snippetOf: (hit) => hit.record.text,
            idOf: (hit) => hit.record.id,
            grader: this.#grader,
            // MRET-2: re-fuse the per-pass lists with RRF before the
            // final topK cut so a reformulation-pass find can outrank
            // pass-1 noise (discovery order silently dropped it).
            fuse: (lists) => fuseRrf(lists, 60),
          },
          {
            maxIterations: opts.maxIterations ?? this.#iterativeMaxIterations,
            maxResults: opts.topK ?? 10,
            ...(opts.forceHard !== undefined ? { forceHard: opts.forceHard } : {}),
            ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
          },
        );
        span.setAttributes({
          'memory.search.semantic.iterative.gate_hard': result.gateHard,
          'memory.search.semantic.iterative.iterations': result.iterations,
          'memory.search.semantic.iterative.sufficient': result.sufficient,
          'memory.search.semantic.iterative.abstained': result.abstained,
          'memory.search.semantic.iterative.query_count': result.queries.length,
          'memory.search.semantic.iterative.final_count': result.hits.length,
        });
        return result;
      },
    );
  }

  /**
   * Raw vector KNN neighbours for the consolidator's reconcile
   * pre-filter (P0-3). Unlike {@link search} this skips FTS, reranking,
   * and decay so the cosine scores survive intact (the conflict-pipeline
   * zone thresholds are calibrated against them), and it **includes
   * quarantined facts** so prior synthesized memories are visible to
   * reconciliation. Returns `[]` when no embedder / vector adapter is
   * configured — the consolidator then treats every candidate as a
   * fresh `add`, degrading gracefully to the pre-reconcile behaviour.
   *
   * @stable
   */
  async neighbors(
    scope: SessionScope,
    text: string,
    opts: { readonly topK?: number } = {},
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    return this.#tryVectorSearch(scope, text, opts.topK ?? 10, undefined, true);
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
   * that admits a synthesized memory into action-driving recall once a
   * human (or trusted non-agent caller) has reviewed it. Writes a
   * `memory_history` audit row. Requires a storage adapter that
   * implements `SemanticMemoryStoreExt.setStatus(...)` — the default
   * `@graphorin/store-sqlite` adapter wires this through.
   *
   * MRET-3 / MST-1: promotion of a fact whose text still trips the
   * offline injection heuristics is **refused** with
   * {@link QuarantinePromotionRefusedError} — the model-facing
   * `fact_validate` tool calls this with no `force`, so a poisoned
   * memory can never be promoted by the agent itself (the one-turn
   * `fact_remember(poison)` → `fact_validate(id)` chain is closed). An
   * operator can override after review by passing `{ force: true }`
   * from a trusted (non-agent) context. Synthesized-but-clean writes
   * (consolidator / reflection) promote normally.
   *
   * @stable
   */
  async validate(
    scope: SessionScope,
    factId: string,
    reason?: string,
    options?: { readonly force?: boolean },
  ): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.semantic',
      scope,
      { 'memory.semantic.action': 'validate', 'memory.semantic.fact_id': factId },
      async (span) => {
        if (typeof this.#store.semantic.setStatus !== 'function') {
          throw new TypeError(
            '[graphorin/memory] SemanticMemory.validate(...) requires a storage adapter that implements `semantic.setStatus(id, status)`. ' +
              'The default `@graphorin/store-sqlite` adapter implements it; custom adapters can opt in via SemanticMemoryStoreExt.',
          );
        }
        const force = options?.force === true;
        // Re-derive the injection verdict from the stored (immutable)
        // text. A poison candidate stays flagged forever, so this gate
        // does not depend on persisting a quarantine reason.
        const existing = await this.#fetchExisting(factId);
        if (existing !== null && !force) {
          const injection = detectMemoryInjection(existing.text);
          if (injection.flagged) {
            span.setAttributes({
              'memory.semantic.validate.refused': true,
              'memory.semantic.injection_markers': injection.markers.join(','),
            });
            throw new QuarantinePromotionRefusedError(factId, injection.markers);
          }
        }
        span.setAttributes({ 'memory.semantic.validate.forced': force });
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

  /**
   * Pure weighted-fusion helper (X-2) — like {@link SemanticMemory.fuseRrf}
   * but scales each list `i`'s reciprocal-rank contribution by
   * `weights[i]`. A missing / invalid entry defaults to `1`, so equal or
   * absent weights reproduce RRF.
   */
  static fuseWeighted<TRecord extends Fact>(
    lists: ReadonlyArray<ReadonlyArray<MemoryHit<TRecord>>>,
    weights: ReadonlyArray<number> | undefined,
    k = 60,
  ): ReadonlyArray<MemoryHit<TRecord>> {
    return fuseWeighted(lists, weights, k);
  }

  /**
   * Multi-query expansion (P2-3). Returns the original query followed by
   * up to `multiQuery - 1` deduped reworded variants. A no-op (`[query]`)
   * when `multiQuery` is unset / `<= 1` or no transformer is configured —
   * so the default path makes no provider call. A transformer failure
   * degrades to `[query]` rather than breaking recall.
   */
  async #expandQueries(query: string, opts: FactSearchOptions): Promise<ReadonlyArray<string>> {
    const n = opts.multiQuery;
    if (n === undefined || n <= 1 || this.#queryTransformer === null) return [query];
    try {
      const variants = await this.#queryTransformer.expand(query, n - 1, {
        ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
      });
      const seen = new Set<string>([query.trim().toLowerCase()]);
      const out: string[] = [query];
      for (const variant of variants) {
        const trimmed = variant.trim();
        const key = trimmed.toLowerCase();
        if (trimmed.length === 0 || seen.has(key)) continue;
        seen.add(key);
        out.push(trimmed);
        if (out.length >= n) break;
      }
      return out;
    } catch {
      return [query];
    }
  }

  /**
   * HyDE retrieval (P2-3). Generates a hypothetical answer, embeds it,
   * and returns its vector neighbours to fuse into the result. A no-op
   * (`[]`) unless `hyde` is set, a transformer is configured, **and** an
   * embedder + vector surface exist — the embedder guard is checked
   * *first* so a missing embedder skips the LLM call entirely rather than
   * generating a passage that can never be embedded.
   */
  async #tryHyde(
    scope: SessionScope,
    query: string,
    opts: FactSearchOptions,
    topK: number,
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    if (opts.hyde !== true || this.#queryTransformer === null) return [];
    if (
      this.#embedder === null ||
      this.#embedderIdProvider() === null ||
      typeof this.#store.semantic.searchVector !== 'function'
    ) {
      return [];
    }
    try {
      const pseudo = await this.#queryTransformer.hypothetical(query, {
        ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
      });
      if (pseudo === null || pseudo.trim().length === 0) return [];
      return this.#tryVectorSearch(scope, pseudo, topK, opts.asOf, opts.includeQuarantined);
    } catch {
      return [];
    }
  }

  /**
   * One-hop graph expansion (P2-1). Seeds on the unique fact ids already
   * gathered into `lists` and fuses in facts sharing a canonical entity,
   * via the adapter's recursive-CTE `graph.expandOneHop`. A no-op (`[]`)
   * unless `expandHops >= 1` and the adapter exposes `graph` — and
   * resilient: a traversal error degrades to no expansion rather than
   * breaking recall. Neighbours carry a `graph` signal so explanations
   * (X-3) can attribute a hit to the hop.
   */
  async #tryExpandHops(
    scope: SessionScope,
    lists: ReadonlyArray<ReadonlyArray<MemoryHit<Fact>>>,
    opts: FactSearchOptions,
    limit: number,
  ): Promise<ReadonlyArray<MemoryHit<Fact>>> {
    const hops = opts.expandHops ?? 0;
    const graphStore = this.#store.graph;
    if (hops < 1 || graphStore === undefined || typeof graphStore.expandOneHop !== 'function') {
      return [];
    }
    const seedIds: string[] = [];
    const seen = new Set<string>();
    for (const list of lists) {
      for (const hit of list) {
        if (!seen.has(hit.record.id)) {
          seen.add(hit.record.id);
          seedIds.push(hit.record.id);
        }
      }
    }
    if (seedIds.length === 0) return [];
    try {
      const neighbours = await graphStore.expandOneHop(scope, seedIds, {
        maxHops: hops,
        limit,
        ...(opts.includeQuarantined === true ? { includeQuarantined: true } : {}),
        ...(opts.asOf !== undefined ? { asOf: opts.asOf } : {}),
      });
      return neighbours.map((fact) => ({
        record: fact,
        score: 1,
        signals: Object.freeze({ graph: 1 }),
      }));
    } catch {
      return [];
    }
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
      // Record the decay multiplier as a signal so recall explanations
      // (X-3) can attribute the score drop to staleness, not just to
      // fusion. Hits with no decay row keep their signals untouched.
      return {
        ...hit,
        score: hit.score * retention,
        signals: Object.freeze({ ...(hit.signals ?? {}), decay: retention }),
      };
    });
    const sorted = [...out].sort((a, b) => b.score - a.score);
    return Object.freeze(sorted);
  }
}
