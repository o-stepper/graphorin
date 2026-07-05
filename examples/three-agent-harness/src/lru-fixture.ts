/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Canonical "expected Generator output" for the three-agent harness
 * smoke test. The Planner / Generator / Evaluator workload prompts
 * the Generator to "implement a thread-safe LRU cache in TypeScript
 * with tests"; the deterministic stub provider replies with this
 * exact source so the smoke test can assert byte-equality against
 * the LRUCache reference. The class itself is a real, working
 * Map-backed least-recently-used cache so the snippet remains useful
 * as documentation if a reader copy-pastes it.
 */

/** Size-bounded LRU cache; eviction order matches `Map` insertion order. */
export const LRU_FIXTURE_SOURCE = `export class LRUCache<K, V> {
  private readonly map = new Map<K, V>();
  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new TypeError('LRUCache capacity must be a positive integer.');
    }
  }
  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key) as V;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }
  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      const oldestKey = this.map.keys().next().value as K;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
  has(key: K): boolean {
    return this.map.has(key);
  }
  get size(): number {
    return this.map.size;
  }
}
`;

/**
 * Live LRUCache implementation that mirrors the source string above.
 * Ships in the example so smoke / future benchmark code can exercise
 * the API without `eval`-ing the fixture string.
 */
export class LRUCache<K, V> {
  private readonly map = new Map<K, V>();
  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new TypeError('LRUCache capacity must be a positive integer.');
    }
  }
  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key) as V;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }
  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      const oldestKey = this.map.keys().next().value as K;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
  has(key: K): boolean {
    return this.map.has(key);
  }
  get size(): number {
    return this.map.size;
  }
}
