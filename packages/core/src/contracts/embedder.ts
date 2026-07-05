/**
 * Pluggable embedding provider. Implementations live in the embedder
 * adapter packages (`@graphorin/embedder-transformersjs` (default),
 * `@graphorin/embedder-ollama`, …).
 *
 * Each embedder advertises its model `id`, output `dim`, and a stable
 * `configHash` used by the multi-table per-embedder vec0 layout in the
 * default SQLite store: facts indexed under embedder A and facts indexed
 * under embedder B live in separate vec0 tables; the `configHash` is the
 * lookup key.
 *
 * @stable
 */
export interface EmbedderProvider {
  /** Stable identifier (e.g. `'transformersjs:Xenova/multilingual-e5-base'`). */
  id(): string;
  /** Output dimensionality of the embedding vectors. */
  dim(): number;
  /** Stable hash of the embedder's configuration (model + revision + opts). */
  configHash(): string;
  /** Compute embeddings for a batch of texts. Returns one vector per text. */
  embed(texts: ReadonlyArray<string>, opts?: EmbedOptions): Promise<ReadonlyArray<Float32Array>>;
}

/**
 * Per-call options for `EmbedderProvider.embed(...)`.
 *
 * @stable
 */
export interface EmbedOptions {
  readonly signal?: AbortSignal;
  /** Optional per-call request id forwarded to the trace span. */
  readonly requestId?: string;
  /**
   * Asymmetric retrieval role of the input (PS-10). Embedders for models that
   * require asymmetric prefixes - the E5 family's `query:` / `passage:` - apply
   * the matching prefix; embedders for symmetric models ignore it. Memory tiers
   * pass `'query'` when embedding a search query and `'passage'` when embedding
   * content for storage.
   */
  readonly taskType?: 'query' | 'passage';
}
