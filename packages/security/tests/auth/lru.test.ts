import { describe, expect, it } from 'vitest';

import { LruCache } from '../../src/auth/lru.js';

describe('@graphorin/security/auth - LruCache', () => {
  it('rejects non-positive max', () => {
    expect(() => new LruCache(0)).toThrow(RangeError);
    expect(() => new LruCache(-1)).toThrow(RangeError);
    expect(() => new LruCache(1.5)).toThrow(RangeError);
  });

  it('evicts the least-recently-used entry', () => {
    const cache = new LruCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a');
    cache.set('c', 3);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('expired entries are dropped lazily', () => {
    const cache = new LruCache<string, number>(2);
    cache.set('a', 1, 100, 0);
    expect(cache.get('a', 50)).toBe(1);
    expect(cache.get('a', 200)).toBeUndefined();
  });

  it('treats infinite TTL as never-expires', () => {
    const cache = new LruCache<string, number>(2);
    cache.set('a', 1);
    expect(cache.get('a', Number.MAX_SAFE_INTEGER)).toBe(1);
  });

  it('delete removes an entry', () => {
    const cache = new LruCache<string, number>(2);
    cache.set('a', 1);
    expect(cache.delete('a')).toBe(true);
    expect(cache.delete('a')).toBe(false);
  });

  it('clear empties the cache', () => {
    const cache = new LruCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('size reflects the number of live entries', () => {
    const cache = new LruCache<string, number>(2);
    expect(cache.size).toBe(0);
    cache.set('a', 1);
    expect(cache.size).toBe(1);
  });
});
