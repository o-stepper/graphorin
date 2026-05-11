/**
 * Wait-then-defer lock manager. The lock state lives in the storage
 * layer's `consolidator_state` row so concurrent processes (lib +
 * server) coordinate through SQLite. The manager waits up to
 * `lockWaitMs` for the lock to clear; if the wait expires it returns
 * `'deferred'` so the trigger is recorded but no phase runs.
 *
 * The lock honours DEC-114 ("memory does not block the agent loop")
 * by capping the wait — the agent loop never observes a memory
 * blocker.
 *
 * @packageDocumentation
 */

import type { SessionScope } from '@graphorin/core';
import type { ConsolidatorMemoryStoreExt } from '../internal/storage-adapter.js';

/** Outcome surfaced by {@link LockManager.acquire}. */
export type LockOutcome =
  | { readonly kind: 'acquired'; readonly runId: string }
  | { readonly kind: 'deferred'; readonly heldBy: string | null };

/** Options accepted by {@link LockManager}. */
export interface LockManagerOptions {
  readonly store: ConsolidatorMemoryStoreExt | null;
  readonly waitMs: number;
  readonly maxRunDurationMs: number;
  readonly now?: () => number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly randomId?: () => string;
}

const DEFAULT_POLL_MS = 100;

/** @stable */
export class LockManager {
  readonly #store: ConsolidatorMemoryStoreExt | null;
  readonly #waitMs: number;
  readonly #maxAge: number;
  readonly #now: () => number;
  readonly #sleep: (ms: number) => Promise<void>;
  readonly #randomId: () => string;
  // Per-process fallback when the storage adapter does not expose a
  // consolidator surface (lib mode + in-memory test doubles).
  readonly #localLocks = new Map<string, { runId: string; acquiredAt: number }>();

  constructor(opts: LockManagerOptions) {
    this.#store = opts.store;
    this.#waitMs = Math.max(0, opts.waitMs);
    this.#maxAge = Math.max(0, opts.maxRunDurationMs);
    this.#now = opts.now ?? Date.now;
    this.#sleep =
      opts.sleep ??
      ((ms): Promise<void> => new Promise((resolve) => globalThis.setTimeout(resolve, ms)));
    this.#randomId =
      opts.randomId ??
      ((): string => {
        const a = Math.floor(Math.random() * 1e9).toString(36);
        const b = Math.floor(Math.random() * 1e9).toString(36);
        return `run_${a}${b}`;
      });
  }

  /**
   * Try to acquire the per-scope lock. Returns the run id on success
   * or `'deferred'` after the wait window elapses.
   *
   * @stable
   */
  async acquire(scope: SessionScope): Promise<LockOutcome> {
    const runId = this.#randomId();
    const start = this.#now();
    const pollMs = Math.min(DEFAULT_POLL_MS, Math.max(10, this.#waitMs / 5 || DEFAULT_POLL_MS));
    while (true) {
      const ok = await this.#tryAcquire(scope, runId);
      if (ok) return { kind: 'acquired', runId };
      const elapsed = this.#now() - start;
      if (elapsed >= this.#waitMs) {
        const heldBy = await this.#heldBy(scope);
        return { kind: 'deferred', heldBy };
      }
      await this.#sleep(pollMs);
    }
  }

  /**
   * Release the lock. Idempotent — releasing an already-released
   * lock is a no-op.
   *
   * @stable
   */
  async release(scope: SessionScope, runId: string): Promise<void> {
    if (this.#store !== null) {
      await this.#store.releaseLock(scope, runId);
    }
    const key = scopeKey(scope);
    const local = this.#localLocks.get(key);
    if (local !== undefined && local.runId === runId) {
      this.#localLocks.delete(key);
    }
  }

  async #tryAcquire(scope: SessionScope, runId: string): Promise<boolean> {
    const now = this.#now();
    if (this.#store !== null) {
      return this.#store.acquireLock(scope, runId, now, this.#maxAge);
    }
    // Fall back to per-process map.
    const key = scopeKey(scope);
    const existing = this.#localLocks.get(key);
    if (existing === undefined) {
      this.#localLocks.set(key, { runId, acquiredAt: now });
      return true;
    }
    if (existing.runId === runId) return true;
    if (this.#maxAge > 0 && now - existing.acquiredAt > this.#maxAge) {
      this.#localLocks.set(key, { runId, acquiredAt: now });
      return true;
    }
    return false;
  }

  async #heldBy(scope: SessionScope): Promise<string | null> {
    if (this.#store !== null) {
      const state = await this.#store.getState(scope);
      return state?.activeLockHeldBy ?? null;
    }
    const local = this.#localLocks.get(scopeKey(scope));
    return local?.runId ?? null;
  }
}

function scopeKey(scope: SessionScope): string {
  return `${scope.userId}|${scope.sessionId ?? ''}|${scope.agentId ?? ''}`;
}
