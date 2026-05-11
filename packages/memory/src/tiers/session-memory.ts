import type {
  AgentRegistryEntry,
  MemoryHit,
  Message,
  MessageRef,
  SessionListOptions,
  SessionScope,
  Tracer,
} from '@graphorin/core';
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
 * `SessionMemory` — append-only message log per session. Owns the
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

  /** Persist a message. Returns the storage reference. */
  async push(scope: SessionScope, message: Message): Promise<MessageRef> {
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
        const ref = await this.#store.session.push(scope, message);
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
   * Surface high-importance items as a silent turn for the model.
   * Phase 10a ships a no-op shell; Phase 10c (Consolidator) populates
   * the actual flush behaviour. The method exists in 10a so callers
   * can wire the contract today without conditional checks.
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
      { 'memory.session.action': 'flush-important' },
      async () => ({ flushed: 0 }),
    );
  }

  /**
   * Phase 10a ships the deterministic minimum-viable compaction:
   * summarises the request as a counter-only shape. Phase 10c
   * replaces the inner body with the LLM-summarized cutoff.
   */
  async compact(
    scope: SessionScope,
    opts: { keepLastN?: number } = {},
  ): Promise<SessionCompactionResult> {
    return withMemorySpan(
      this.#tracer,
      'memory.write.session',
      scope,
      { 'memory.session.action': 'compact' },
      async (span) => {
        const messages = await this.#store.session.list(scope, {});
        const keep = Math.max(0, opts.keepLastN ?? 0);
        const total = messages.length;
        const removed = Math.max(0, total - keep);
        span.setAttributes({
          'memory.session.compact.removed': removed,
          'memory.session.compact.summarized': removed,
        });
        return { removed, summarized: removed };
      },
    );
  }

  /**
   * Returns `true` when the cached message tokens exceed
   * `compactAtRatio * contextWindow` (default `0.9` per DEC-104). The
   * second argument can be either:
   *
   *  - a `number` — interpreted as the live `contextWindow` size in
   *    tokens (matches the documented memory-system spec signature);
   *  - an options bag — `{ usedTokens?, contextWindow? }`. When
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
   * Returns the registered agents that participated in the supplied
   * scope. The default sqlite adapter exposes `agents_registry` rows
   * via the sessions store; this convenience accessor resolves them
   * without requiring callers to import the sessions package.
   *
   * The method is best-effort — adapters that do not maintain an
   * agent registry simply return an empty list.
   */
  async attributedFor(scope: SessionScope): Promise<ReadonlyArray<AgentRegistryEntry>> {
    void scope;
    // Phase 10a ships an empty shell; Phase 11 wires the registry
    // through the sessions facade. Returning [] at this layer keeps
    // the contract stable without leaking adapter internals.
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
