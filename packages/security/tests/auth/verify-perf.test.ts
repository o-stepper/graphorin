/**
 * Phase 03b performance benchmark — `verifyToken` warm-cache hit
 * latency. The DoD requires < 100 µs p95 for cache-hit verifications
 * (matches the ~30 µs target in the architecture spec). The actual
 * threshold is left somewhat loose so the test is stable on slow CI
 * runners while still catching pathological regressions in the warm
 * path (extra HMAC, extra await chains, accidental store calls, etc.).
 */

import { describe, expect, it } from 'vitest';

import { createToken, generatePepper } from '../../src/auth/crud.js';
import { TokenVerifier } from '../../src/auth/verify.js';

import { createMemoryAuthTokenStore } from './_helpers.js';

describe('Phase 03b — verifyToken warm-cache latency', () => {
  it('p95 cache-hit verify is below 200 µs (DoD: < 100 µs target, headroom for CI)', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    const verifier = new TokenVerifier({ tokenStore, pepper });
    const raw = created.raw.reveal();

    // Warm the cache: first call exercises the cold path (store list
    // + HMAC) and writes the LRU entry.
    await verifier.verify(raw);

    const N = 10_000;
    const samples = new Array<number>(N);
    for (let i = 0; i < N; i += 1) {
      const start = performance.now();
      const result = await verifier.verify(raw);
      const elapsed = performance.now() - start;
      if (!result.ok) throw new Error('expected cache hit');
      samples[i] = elapsed;
    }
    samples.sort((a, b) => a - b);
    const p95Ms = samples[Math.floor(N * 0.95)] ?? samples[N - 1] ?? 0;
    const p95Us = p95Ms * 1000;
    // Generous threshold for CI noise; flag obvious regressions.
    expect(p95Us).toBeLessThan(200);
  });

  it('warm-path verify never calls AuthTokenStore.list (cache hit)', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    let listCalls = 0;
    const wrapped = {
      ...tokenStore,
      async list() {
        listCalls += 1;
        return tokenStore.list();
      },
    };
    const verifier = new TokenVerifier({ tokenStore: wrapped, pepper });
    const raw = created.raw.reveal();
    await verifier.verify(raw); // cold path
    listCalls = 0;
    for (let i = 0; i < 1000; i += 1) {
      await verifier.verify(raw);
    }
    expect(listCalls).toBe(0);
  });
});
