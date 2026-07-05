/**
 * `AgentRegistry` - the per-session-manager catalogue of every agent
 * that has ever produced a message in a session. The registry exists
 * to keep replay working long after the agent has been renamed or
 * deleted: orphan `agent_id` references on stored messages can always
 * be resolved via `resolveOrPlaceholder(...)`.
 *
 * The registry is in-memory + write-through to the configured
 * `SessionStoreExt`. The package-level singleton instance is owned by
 * the {@link createSessionManager} facade in `./facade.ts`; consumers
 * never construct an `AgentRegistry` directly.
 *
 * @packageDocumentation
 */

import type { AgentRegistryEntry, SessionStoreExt } from '@graphorin/core/contracts';
import { AgentNotFoundError } from './errors/index.js';

/**
 * Result of {@link AgentRegistry.resolveOrPlaceholder}. Either the
 * stored agent metadata, or a placeholder discriminated by
 * `kind: 'unknown'` so callers can render "(deleted) Worker Agent".
 *
 * @stable
 */
export type AgentRegistryLookup =
  | { readonly kind: 'agent'; readonly agent: AgentRegistryEntry }
  | { readonly kind: 'unknown'; readonly id: string };

/**
 * Optional options accepted by {@link AgentRegistry.register}. The
 * registration is idempotent on `id` - re-registering the same id
 * refreshes the display name + tags.
 *
 * @stable
 */
export interface RegisterAgentOptions {
  readonly displayName: string;
  readonly tags?: ReadonlyArray<string>;
  /** Override the registration timestamp (test seam). */
  readonly registeredAt?: string;
}

/**
 * Optional options accepted by {@link AgentRegistry.retire} and
 * {@link AgentRegistry.delete}.
 *
 * @stable
 */
export interface RetireAgentOptions {
  readonly reason?: string;
  /** Throw {@link AgentNotFoundError} when the id is unknown. */
  readonly assertExists?: boolean;
}

/** Same shape as {@link RetireAgentOptions} for `delete(...)`. */
export type DeleteAgentOptions = RetireAgentOptions;

/**
 * In-memory + write-through registry of agent metadata.
 *
 * @stable
 */
export class AgentRegistry {
  readonly #store: SessionStoreExt;
  readonly #cache = new Map<string, AgentRegistryEntry>();
  readonly #now: () => number;

  constructor(args: { readonly store: SessionStoreExt; readonly now?: () => number }) {
    this.#store = args.store;
    this.#now = args.now ?? Date.now;
  }

  /**
   * Hydrate the in-memory cache from the store. Useful when a process
   * boots after a restart and wants the agent catalogue ready before
   * any `Session.list({...})` call.
   */
  async hydrate(): Promise<void> {
    const rows = await this.#store.listAgents();
    this.#cache.clear();
    for (const row of rows) this.#cache.set(row.id, row);
  }

  /**
   * Idempotent registration. Re-registering the same id refreshes the
   * display name + tags but preserves the original `registeredAt`.
   */
  async register(id: string, opts: RegisterAgentOptions): Promise<AgentRegistryEntry> {
    const existing = this.#cache.get(id) ?? (await this.#store.resolveAgent(id)) ?? undefined;
    const entry: AgentRegistryEntry = {
      id,
      displayName: opts.displayName,
      registeredAt:
        existing?.registeredAt ?? opts.registeredAt ?? new Date(this.#now()).toISOString(),
      ...(opts.tags !== undefined ? { tags: [...opts.tags] } : {}),
      ...(existing?.retiredAt !== undefined ? { retiredAt: existing.retiredAt } : {}),
    };
    await this.#store.registerAgent(entry);
    this.#cache.set(id, entry);
    return entry;
  }

  /**
   * Soft-retire an agent. Subsequent `resolveOrPlaceholder(id)` still
   * returns the metadata (with `retiredAt` set) so replay shows
   * "(retired) Worker Agent". Pass `{ assertExists: true }` to throw
   * on an unknown id.
   */
  async retire(id: string, opts: RetireAgentOptions = {}): Promise<void> {
    const existing = this.#cache.get(id) ?? (await this.#store.resolveAgent(id));
    if (existing === null || existing === undefined) {
      if (opts.assertExists === true) throw new AgentNotFoundError(id);
      return;
    }
    const retiredAt = new Date(this.#now()).toISOString();
    await this.#store.retireAgent(id, retiredAt);
    const updated: AgentRegistryEntry = { ...existing, retiredAt };
    this.#cache.set(id, updated);
  }

  /**
   * Hard-delete an agent. Subsequent `resolveOrPlaceholder(id)`
   * returns `{ kind: 'unknown', id }` so replay can substitute a
   * placeholder.
   */
  async delete(id: string, opts: DeleteAgentOptions = {}): Promise<void> {
    const existing = this.#cache.get(id) ?? (await this.#store.resolveAgent(id));
    if (existing === null || existing === undefined) {
      if (opts.assertExists === true) throw new AgentNotFoundError(id);
      return;
    }
    await this.#store.deleteAgent(id);
    this.#cache.delete(id);
  }

  /**
   * Best-effort lookup. Returns `null` when the agent is unknown.
   */
  async get(id: string): Promise<AgentRegistryEntry | null> {
    const cached = this.#cache.get(id);
    if (cached !== undefined) return cached;
    const row = await this.#store.resolveAgent(id);
    if (row !== null) this.#cache.set(id, row);
    return row;
  }

  /**
   * List every known agent (active + retired).
   */
  async list(): Promise<ReadonlyArray<AgentRegistryEntry>> {
    return this.#store.listAgents();
  }

  /**
   * Replay-safe lookup. Returns `{ kind: 'agent', agent }` when the id
   * is known (active or retired), or `{ kind: 'unknown', id }` when
   * the agent has been hard-deleted.
   */
  async resolveOrPlaceholder(id: string): Promise<AgentRegistryLookup> {
    const agent = await this.get(id);
    if (agent === null) return { kind: 'unknown', id };
    return { kind: 'agent', agent };
  }

  /**
   * Snapshot of the in-memory cache. Used by JSONL export to embed
   * `kind: 'agent'` records without an extra round-trip to the store.
   */
  snapshot(): ReadonlyArray<AgentRegistryEntry> {
    return [...this.#cache.values()];
  }
}
