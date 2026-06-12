import type { MemoryHit, MemoryRecord } from '@graphorin/core';

/**
 * Pluggable reranker contract. Concrete implementations live in
 * `@graphorin/memory/search` (the built-in `RRFReranker`) and the
 * Phase 16 optional packages (`@graphorin/reranker-transformersjs`,
 * `@graphorin/reranker-llm`).
 *
 * The reranker accepts one or more parallel ranked lists (vector +
 * FTS5 + optional entity boost) and produces a single fused ranking.
 * Implementations MUST be pure (no I/O outside `signal`-aware
 * dependencies) so the agent runtime can call them mid-stream without
 * deadlocking the main loop.
 *
 * @stable
 */
export interface ReRanker {
  /** Stable lowercase identifier surfaced on every span. */
  readonly id: string;
  /**
   * Rerank one or more parallel ranked lists and return the fused
   * top-K (default `topK = 10`). Each input list must already be
   * sorted by `score` descending.
   */
  rerank<TRecord extends MemoryRecord>(
    query: string,
    lists: ReadonlyArray<ReadonlyArray<MemoryHit<TRecord>>>,
    options?: ReRankOptions,
  ): Promise<ReadonlyArray<MemoryHit<TRecord>>>;
}

/**
 * Per-call reranker options. `topK` defaults to `10`; `signal` is
 * propagated to any async work the reranker performs.
 *
 * @stable
 */
export interface ReRankOptions {
  readonly topK?: number;
  readonly signal?: AbortSignal;
  /**
   * Stable per-list labels for the explanation signals (MRET-13) —
   * `rrf.<label>` instead of the ephemeral `rrf.list_<index>`. Callers
   * that fan lists out conditionally (multi-query, HyDE, graph) pass
   * retriever-kind labels so X-3 consumers can identify which leg a
   * contribution came from across calls. Missing entries fall back to
   * the positional key.
   */
  readonly labels?: ReadonlyArray<string>;
}
