import type {
  EmbedderProvider,
  Episode,
  MemoryHit,
  MemoryProvenance,
  MemoryStatus,
  Sensitivity,
  SessionScope,
  Tracer,
} from '@graphorin/core';
import { newMemoryId } from '../internal/id.js';
import { withMemorySpan } from '../internal/spans.js';
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';

/**
 * Author-time episode payload. The framework derives `id`,
 * `kind: 'episodic'`, `userId`, `createdAt`, `updatedAt`, and the
 * `embedder_id` from the surrounding `EpisodicMemory.record(...)`
 * call.
 *
 * @stable
 */
export interface EpisodeInput {
  readonly summary: string;
  readonly startedAt: string;
  readonly endedAt: string;
  /** Optional importance score in `[0, 1]`. */
  readonly importance?: number;
  readonly sensitivity?: Sensitivity;
  readonly tags?: ReadonlyArray<string>;
  /**
   * Trust-provenance tag (P1-4). Episodes auto-formed by the
   * consolidator pass `'extraction'` so they land quarantined; omit
   * (defaults to first-party `active`) for user-authored episodes.
   */
  readonly provenance?: MemoryProvenance;
  /**
   * Retrieval-trust state (P1-4). Defaults to `active`; the
   * consolidator records auto-formed episodes as `'quarantined'` so
   * they are excluded from action-driving recall until validated.
   */
  readonly status?: MemoryStatus;
}

/**
 * Triple-signal episode retrieval weights. Defaults match DEC-105:
 * `recency 0.3`, `relevance 0.5`, `importance 0.2`. Implementations
 * normalize the weighted sum back to `[0, 1]`.
 *
 * @stable
 */
export interface EpisodeRetrievalWeights {
  readonly recency: number;
  readonly relevance: number;
  readonly importance: number;
}

const DEFAULT_WEIGHTS: EpisodeRetrievalWeights = Object.freeze({
  recency: 0.3,
  relevance: 0.5,
  importance: 0.2,
});

/**
 * Per-call options accepted by {@link EpisodicMemory.search}.
 *
 * @stable
 */
export interface EpisodeSearchOptions {
  readonly topK?: number;
  readonly signal?: AbortSignal;
  readonly weights?: EpisodeRetrievalWeights;
  readonly dateRange?: { readonly from?: string; readonly to?: string };
  /**
   * Point-in-time ("as of") read. When set, only episodes that had
   * started by this instant (`started_at <= asOf`) are returned.
   * ISO-8601. Absent ⇒ current behaviour is unchanged. P0-2.
   *
   * @stable
   */
  readonly asOf?: string;
  /**
   * Include quarantined episodes in the result set (P1-4). Defaults to
   * `false`: action-driving recall never returns quarantined rows. Set
   * `true` only for the validation / inspector path — never for
   * auto-recall fed back into the model. Auto-formed episodes (P1-2)
   * land quarantined, so this is how an operator surfaces them for
   * review.
   *
   * @stable
   */
  readonly includeQuarantined?: boolean;
}

/**
 * `EpisodicMemory` — record + retrieve summarized stretches of past
 * activity. Stored embeddings power triple-signal retrieval (recency
 * × relevance × importance).
 *
 * @stable
 */
export class EpisodicMemory {
  readonly #store: MemoryStoreAdapter;
  readonly #tracer: Tracer;
  readonly #embedder: EmbedderProvider | null;
  readonly #embedderIdProvider: () => string | null;

  constructor(args: {
    store: MemoryStoreAdapter;
    tracer: Tracer;
    embedder: EmbedderProvider | null;
    embedderIdProvider: () => string | null;
  }) {
    this.#store = args.store;
    this.#tracer = args.tracer;
    this.#embedder = args.embedder;
    this.#embedderIdProvider = args.embedderIdProvider;
  }

  /** Persist an episode + its embedding (when an embedder is configured). */
  async record(scope: SessionScope, input: EpisodeInput): Promise<Episode> {
    return withMemorySpan(this.#tracer, 'memory.write.episodic', scope, {}, async (span) => {
      const now = new Date().toISOString();
      const episode: Episode = {
        id: newMemoryId('ep'),
        kind: 'episodic',
        userId: scope.userId,
        ...(scope.sessionId !== undefined ? { sessionId: scope.sessionId } : {}),
        ...(scope.agentId !== undefined ? { agentId: scope.agentId } : {}),
        sensitivity: input.sensitivity ?? 'internal',
        summary: input.summary,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        ...(input.importance !== undefined ? { importance: input.importance } : {}),
        ...(input.tags !== undefined ? { tags: Object.freeze([...input.tags]) } : {}),
        ...(input.provenance !== undefined ? { provenance: input.provenance } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        createdAt: now,
        updatedAt: now,
      };
      const embedderId = this.#embedderIdProvider();
      if (
        this.#embedder !== null &&
        embedderId !== null &&
        typeof this.#store.episodic.putWithEmbedding === 'function'
      ) {
        const [vector] = await this.#embedder.embed([input.summary]);
        if (vector !== undefined) {
          await this.#store.episodic.putWithEmbedding(episode, {
            embedding: { embedderId, vector },
          });
        } else {
          await this.#store.episodic.put(episode);
        }
      } else {
        await this.#store.episodic.put(episode);
      }
      span.setAttributes({
        'memory.episodic.summary_length': input.summary.length,
        ...(input.importance !== undefined
          ? { 'memory.episodic.importance': input.importance }
          : {}),
      });
      return episode;
    });
  }

  /** Lookup a single episode by id. */
  async get(id: string): Promise<Episode | null> {
    return this.#store.episodic.get(id);
  }

  /**
   * Triple-signal episode retrieval (`recency × relevance ×
   * importance`). The vector signal is computed on demand when an
   * embedder is configured AND the storage adapter exposes
   * `searchVector`; otherwise the FTS5 BM25 score is fed into the
   * relevance term as a normalized fallback.
   */
  async search(
    scope: SessionScope,
    query: string,
    opts: EpisodeSearchOptions = {},
  ): Promise<ReadonlyArray<MemoryHit<Episode>>> {
    return withMemorySpan(
      this.#tracer,
      'memory.search.episodic',
      scope,
      { 'memory.search.query_length': query.length },
      async (span) => {
        const topK = opts.topK ?? 10;
        const weights = opts.weights ?? DEFAULT_WEIGHTS;
        const ftsHits = await this.#store.episodic.search(scope, {
          query,
          topK: topK * 2,
          ...(opts.asOf !== undefined ? { asOf: opts.asOf } : {}),
          ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
          ...(opts.includeQuarantined !== undefined
            ? { includeQuarantined: opts.includeQuarantined }
            : {}),
        });
        const vectorHits = await this.#tryVectorSearch(
          scope,
          query,
          topK * 2,
          opts.asOf,
          opts.includeQuarantined,
        );
        const merged = mergeRecency(ftsHits, vectorHits, weights);
        const finalHits = merged.slice(0, topK);
        span.setAttributes({
          'memory.search.episodic.fts_count': ftsHits.length,
          'memory.search.episodic.vector_count': vectorHits.length,
          'memory.search.episodic.final_count': finalHits.length,
          ...(opts.asOf !== undefined ? { 'memory.search.episodic.as_of': opts.asOf } : {}),
        });
        return finalHits;
      },
    );
  }

  /**
   * Soft-archive an episode. Storage adapters that implement
   * `EpisodicMemoryStoreExt.archive(...)` mark the row archived in
   * place. Adapters that do not expose the extension surface a
   * friendly `TypeError` so the operator can opt the storage layer
   * in (or call `episodic.put(...)` with the archived state set
   * manually).
   */
  async archive(scope: SessionScope, episodeId: string, reason?: string): Promise<void> {
    await withMemorySpan(
      this.#tracer,
      'memory.write.episodic',
      scope,
      { 'memory.episodic.action': 'archive', 'memory.episodic.episode_id': episodeId },
      async () => {
        if (typeof this.#store.episodic.archive !== 'function') {
          throw new TypeError(
            '[graphorin/memory] EpisodicMemory.archive(...) requires a storage adapter that implements `episodic.archive(id)`. ' +
              'The default `@graphorin/store-sqlite` adapter implements it; custom adapters can opt in via EpisodicMemoryStoreExt.',
          );
        }
        await this.#store.episodic.archive(episodeId, reason);
      },
    );
  }

  /** List the most recent episodes (no embedding required). */
  async recent(scope: SessionScope, opts: { topK?: number } = {}): Promise<ReadonlyArray<Episode>> {
    return withMemorySpan(this.#tracer, 'memory.read.episodic', scope, {}, async (span) => {
      const topK = opts.topK ?? 10;
      const hits = await this.#store.episodic.search(scope, {
        query: '*',
        topK,
      });
      const out = hits.map((h) => h.record);
      span.setAttributes({ 'memory.read.episodic.count': out.length });
      return out;
    });
  }

  async #tryVectorSearch(
    scope: SessionScope,
    query: string,
    topK: number,
    asOf?: string,
    includeQuarantined?: boolean,
  ): Promise<ReadonlyArray<MemoryHit<Episode>>> {
    const embedderId = this.#embedderIdProvider();
    if (
      this.#embedder === null ||
      embedderId === null ||
      typeof this.#store.episodic.searchVector !== 'function'
    ) {
      return [];
    }
    const [vector] = await this.#embedder.embed([query]);
    if (vector === undefined) return [];
    return this.#store.episodic.searchVector(
      scope,
      vector,
      embedderId,
      topK,
      asOf,
      includeQuarantined,
    );
  }
}

function mergeRecency(
  ftsHits: ReadonlyArray<MemoryHit<Episode>>,
  vectorHits: ReadonlyArray<MemoryHit<Episode>>,
  weights: EpisodeRetrievalWeights,
): ReadonlyArray<MemoryHit<Episode>> {
  const now = Date.now();
  const aggregates = new Map<
    string,
    {
      record: Episode;
      relevance: number;
      recency: number;
      importance: number;
      score: number;
      signals: Record<string, number>;
    }
  >();
  for (const hit of ftsHits) {
    const id = hit.record.id;
    const recency = computeRecency(now, hit.record);
    const importance = hit.record.importance ?? 0;
    const relevance = normalizeRelevance(hit.score);
    const score =
      weights.recency * recency + weights.relevance * relevance + weights.importance * importance;
    aggregates.set(id, {
      record: hit.record,
      relevance,
      recency,
      importance,
      score,
      signals: { fts: relevance, recency, importance },
    });
  }
  for (const hit of vectorHits) {
    const id = hit.record.id;
    const cosine = clamp01(hit.score);
    const existing = aggregates.get(id);
    if (existing === undefined) {
      const recency = computeRecency(now, hit.record);
      const importance = hit.record.importance ?? 0;
      const score =
        weights.recency * recency + weights.relevance * cosine + weights.importance * importance;
      aggregates.set(id, {
        record: hit.record,
        relevance: cosine,
        recency,
        importance,
        score,
        signals: { vector: cosine, recency, importance },
      });
    } else {
      const blended = Math.max(existing.relevance, cosine);
      existing.relevance = blended;
      existing.score =
        weights.recency * existing.recency +
        weights.relevance * blended +
        weights.importance * existing.importance;
      existing.signals.vector = cosine;
      existing.signals['rrf-blend'] = blended;
    }
  }
  const out = Array.from(aggregates.values()).map((a) => ({
    record: a.record,
    score: a.score,
    signals: Object.freeze({ ...a.signals }),
  }));
  out.sort((a, b) => b.score - a.score);
  return out;
}

function computeRecency(now: number, episode: Episode): number {
  const ended = Date.parse(episode.endedAt);
  if (!Number.isFinite(ended)) return 0;
  const elapsedDays = Math.max(0, (now - ended) / (24 * 60 * 60 * 1000));
  return Math.exp(-elapsedDays / 30);
}

function normalizeRelevance(score: number): number {
  return clamp01(1 / (1 + Math.max(0, -score)));
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
