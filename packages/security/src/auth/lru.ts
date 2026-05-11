/**
 * Tiny LRU cache used by the verify pipeline. The implementation is
 * intentionally minimal so the security package does not depend on
 * any third-party cache library; it relies on `Map`'s insertion-order
 * iteration semantics for O(1) eviction.
 *
 * @internal
 */

interface CacheEntry<V> {
  readonly value: V;
  readonly expiresAt: number;
}

/**
 * Bounded LRU cache with optional per-entry TTL. `get` returns
 * `undefined` for expired or missing entries; expired entries are
 * removed lazily on access.
 *
 * @internal
 */
export class LruCache<K, V> {
  readonly #max: number;
  readonly #map = new Map<K, CacheEntry<V>>();

  constructor(max: number) {
    if (!Number.isFinite(max) || max <= 0 || !Number.isInteger(max)) {
      throw new RangeError(`LruCache: max must be a positive integer; got ${max}.`);
    }
    this.#max = max;
  }

  get size(): number {
    return this.#map.size;
  }

  get(key: K, now: number = Date.now()): V | undefined {
    const entry = this.#map.get(key);
    if (entry === undefined) return undefined;
    if (entry.expiresAt !== Number.POSITIVE_INFINITY && entry.expiresAt <= now) {
      this.#map.delete(key);
      return undefined;
    }
    // Touch insertion order so this entry is now the most-recently used.
    this.#map.delete(key);
    this.#map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, ttlMs?: number, now: number = Date.now()): void {
    const expiresAt = ttlMs === undefined ? Number.POSITIVE_INFINITY : now + ttlMs;
    if (this.#map.has(key)) this.#map.delete(key);
    this.#map.set(key, { value, expiresAt });
    while (this.#map.size > this.#max) {
      const oldestKey = this.#map.keys().next().value;
      if (oldestKey === undefined) break;
      this.#map.delete(oldestKey);
    }
  }

  delete(key: K): boolean {
    return this.#map.delete(key);
  }

  clear(): void {
    this.#map.clear();
  }
}
