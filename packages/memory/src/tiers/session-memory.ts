import type {
  AgentRegistryEntry,
  MemoryHit,
  Message,
  MessageRef,
  SessionListOptions,
  SessionMessagePushOptions,
  SessionMessageWithMetadata,
  SessionScope,
  Tracer,
} from '@graphorin/core';
import { newMemoryId } from '../internal/id.js';
import { withMemorySpan } from '../internal/spans.js';
import type { MemoryStoreAdapter } from '../internal/storage-adapter.js';

/**
 * Per-session compaction policy. The default `0.9` matches DEC-104:
 * compaction kicks in once cached message tokens exceed
 * `0.9 * contextWindow`.
 *
 * @stable
 */
export interface SessionCompactionPolicy {
  /** Default `0.9`. */
  readonly compactAtRatio?: number;
  /** Default `8192`. */
  readonly contextWindowTokens?: number;
}

/**
 * Snapshot returned by {@link SessionMemory.compact}. The
 * minimum-viable rendering simply reports counts; the full
 * LLM-summarized cutoff (Phase 10c Consolidator) replaces this
 * implementation later.
 *
 * @stable
 */
export interface SessionCompactionResult {
  readonly removed: number;
  readonly summarized: number;
  readonly summary?: string;
}

/**
 * `SessionMemory` - append-only message log per session. Owns the
 * `session_messages` storage by single-source-of-truth (DEC-147); the
 * `@graphorin/sessions` package wraps this surface in Phase 11.
 *
 * @stable
 */
export class SessionMemory {
  readonly #store: MemoryStoreAdapter;
  readonly #tracer: Tracer;
  readonly #compactionPolicy: SessionCompactionPolicy;

  constructor(args: {
    store: MemoryStoreAdapter;
    tracer: Tracer;
    compactionPolicy?: SessionCompactionPolicy;
  }) {
    this.#store = args.store;
    this.#tracer = args.tracer;
    this.#compactionPolicy = args.compactionPolicy ?? {};
  }

  /**
   * Persist a message. Returns the storage reference.
   * `options.verdict` threads the run loop's per-turn security
   * verdict onto the stored row for the memory ingest gate.
   */
  async push(
    scope: SessionScope,
    message: Message,
    options?: SessionMessagePushOptions,
  ): Promise<MessageRef> {
    return withMemorySpan(
      this.#tracer,
      'memory.write.session',
      scope,
      {
        'memory.session.message_role': message.role,
        ...(message.role === 'assistant' && message.agentId !== undefined
          ? { 'memory.session.agent_id': message.agentId }
          : {}),
      },
      async (span) => {
        const ref = await this.#store.session.push(scope, message, options);
        span.setAttributes({
          'memory.session.sequence': ref.sequence,
          'memory.session.message_id': ref.messageId,
        });
        return ref;
      },
    );
  }

  /** List messages for the supplied scope. */
  async list(scope: SessionScope, opts: SessionListOptions = {}): Promise<ReadonlyArray<Message>> {
    return withMemorySpan(
      this.#tracer,
      'memory.read.session',
      scope,
      {
        ...(opts.lastN !== undefined ? { 'memory.session.last_n': opts.lastN } : {}),
        ...(opts.agentId !== undefined ? { 'memory.session.agent_id': opts.agentId } : {}),
        ...(opts.role !== undefined ? { 'memory.session.role': opts.role } : {}),
      },
      async (span) => {
        const out = await this.#store.session.list(scope, opts);
        span.setAttributes({ 'memory.read.session.count': out.length });
        return out;
      },
    );
  }

  /**
   * List messages with their persisted identity (stored id / sequence /
   * `createdAt`) so an exporter preserves message identity + chronology.
   * Delegates to the store when it supports the richer read.
   */
  async listWithMetadata(
    scope: SessionScope,
    opts: SessionListOptions = {},
  ): Promise<ReadonlyArray<SessionMessageWithMetadata>> {
    const store = this.#store.session;
    if (store.listWithMetadata !== undefined) {
      return store.listWithMetadata(scope, opts);
    }
    // A store without the richer read: fabricate a unique id + the current time
    // (the pre-RP-5 behaviour, just centralised here).
    const messages = await store.list(scope, opts);
    return messages.map((message, i) => ({
      message,
      messageId: newMemoryId('msg'),
      sequence: i + 1,
      createdAt: new Date().toISOString(),
    }));
  }

  /** Hybrid (FTS5) search over the session messages. */
  async search(
    scope: SessionScope,
    query: string,
    opts: { topK?: number; signal?: AbortSignal } = {},
  ): Promise<ReadonlyArray<MemoryHit>> {
    return withMemorySpan(
      this.#tracer,
      'memory.search.session',
      scope,
      { 'memory.search.query_length': query.length },
      async (span) => {
        const out = await this.#store.session.search(scope, query, {
          query,
          ...(opts.topK !== undefined ? { topK: opts.topK } : {}),
          ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
        });
        span.setAttributes({ 'memory.search.session.count': out.length });
        return out;
      },
    );
  }

  /**
   * NOT IMPLEMENTED - always resolves `{ flushed: 0 }` and
   * performs no work. The consolidator pipeline (extraction → facts /
   * episodes) superseded the planned "silent flush turn"; this method
   * remains only for contract stability. Do not branch on its counter.
   *
   * @deprecated Retired in favour of the
   * pre-compaction `memoryFlushHook` (`contextEngine: { compaction: {
   * preCompactionHooks: [memoryFlushHook({ provider })] } }`) - the
   * single flush surface, fired exactly when content is about to be
   * summarized away.
   */
  async flushImportant(
    scope: SessionScope,
    opts: { silent?: boolean } = {},
  ): Promise<{ flushed: number }> {
    void opts;
    return withMemorySpan(
      this.#tracer,
      'memory.write.session',
      scope,
      { 'memory.session.action': 'flush-important', 'memory.session.implemented': false },
      async () => ({ flushed: 0 }),
    );
  }

  /**
   * NOT IMPLEMENTED - always resolves
   * `{ removed: 0, summarized: 0 }` and deletes / summarizes nothing.
   * Session-context compaction is owned by the context engine
   * (`memory.contextEngine.compactNow`, driven by the agent runtime);
   * this tier-level method previously FABRICATED counts (it reported
   * `total - keepLastN` as "removed" while removing nothing - with the
   * default `keepLastN: 0` it claimed to have compacted the whole
   * session). It now reports the truth until a real message splice
   * exists at this layer.
   */
  async compact(
    scope: SessionScope,
    opts: { keepLastN?: number } = {},
  ): Promise<SessionCompactionResult> {
    void opts;
    return withMemorySpan(
      this.#tracer,
      'memory.write.session',
      scope,
      { 'memory.session.action': 'compact', 'memory.session.implemented': false },
      async (span) => {
        span.setAttributes({
          'memory.session.compact.removed': 0,
          'memory.session.compact.summarized': 0,
        });
        return { removed: 0, summarized: 0 };
      },
    );
  }

  /**
   * Returns `true` when the cached message tokens exceed
   * `compactAtRatio * contextWindow` (default `0.9` per DEC-104). The
   * second argument can be either:
   *
   *  - a `number` - interpreted as the live `contextWindow` size in
   *    tokens (matches the documented memory-system spec signature);
   *  - an options bag - `{ usedTokens?, contextWindow? }`. When
   *    `usedTokens` is supplied the call is purely arithmetic; when
   *    omitted, the storage adapter's per-message `token_count`
   *    cache (DEC-131) is consulted via `totalCachedTokens(scope)`,
   *    falling back to a heuristic (~4 chars/token) for cache
   *    misses.
   *
   * @stable
   */
  async shouldCompact(
    scope: SessionScope,
    contextWindowOrOptions: number | { usedTokens?: number; contextWindow?: number } = {},
  ): Promise<boolean> {
    const options =
      typeof contextWindowOrOptions === 'number'
        ? { contextWindow: contextWindowOrOptions }
        : contextWindowOrOptions;
    const ratio = this.#compactionPolicy.compactAtRatio ?? 0.9;
    const window = options.contextWindow ?? this.#compactionPolicy.contextWindowTokens ?? 8192;
    if (options.usedTokens !== undefined) {
      return options.usedTokens / window > ratio;
    }
    if (typeof this.#store.session.totalCachedTokens === 'function') {
      const cached = await this.#store.session.totalCachedTokens(scope);
      if (cached !== null) {
        return cached / window > ratio;
      }
    }
    const messages = await this.#store.session.list(scope, {});
    let used = 0;
    for (const m of messages) used += approximateTokenLength(m);
    return used / window > ratio;
  }

  /**
   * NOT IMPLEMENTED - always resolves `[]`. The agent
   * registry lives in `@graphorin/sessions` and has never been
   * threaded into this tier; the previous JSDoc claimed the default
   * sqlite adapter "resolves" registry rows here, which was false. Use
   * the sessions facade for participant attribution.
   */
  async attributedFor(scope: SessionScope): Promise<ReadonlyArray<AgentRegistryEntry>> {
    void scope;
    return [];
  }
}

function approximateTokenLength(message: Message): number {
  if (message.role === 'system') {
    return Math.ceil(message.content.length / 4);
  }
  if (typeof message.content === 'string') return Math.ceil(message.content.length / 4);
  let total = 0;
  for (const part of message.content) {
    if (part.type === 'text' || part.type === 'reasoning') {
      total += Math.ceil(part.text.length / 4);
    }
  }
  return total;
}
