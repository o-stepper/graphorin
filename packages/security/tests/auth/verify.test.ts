import { describe, expect, it } from 'vitest';

import { createToken, generatePepper } from '../../src/auth/crud.js';
import { TokenVerifyOverloadError } from '../../src/auth/errors.js';
import { authorize, TokenVerifier, verifyToken } from '../../src/auth/verify.js';
import { SecretValue } from '../../src/secrets/secret-value.js';

import { createMemoryAuthTokenStore } from './_helpers.js';

describe('@graphorin/security/auth - verify pipeline', () => {
  it('rejects a malformed token without touching the store', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    let listed = 0;
    const wrappedStore = {
      ...tokenStore,
      async list() {
        listed += 1;
        return tokenStore.list();
      },
    };
    const verifier = new TokenVerifier({ tokenStore: wrappedStore, pepper: generatePepper() });
    const result = await verifier.verify('garbage');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('malformed');
    expect(listed).toBe(0);
  });

  it('returns unknown-token when the HMAC does not match any row', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const verifier = new TokenVerifier({ tokenStore, pepper: generatePepper() });
    const stranger = await createToken({
      tokenStore: createMemoryAuthTokenStore(),
      pepper: generatePepper(),
      env: 'live',
      scopes: ['agents:read'],
    });
    const result = await verifier.verify(stranger.raw.reveal());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unknown-token');
  });

  it('returns the verified token on the happy path', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
      label: 'web',
    });
    const verifier = new TokenVerifier({ tokenStore, pepper });
    const result = await verifier.verify(created.raw.reveal());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.token.tokenId).toBe(created.record.id);
      expect(result.token.label).toBe('web');
      expect(result.token.scopes.length).toBe(1);
      expect(result.token.env).toBe('live');
    }
  });

  it('honours the LRU cache on repeated calls', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    let listCount = 0;
    const wrappedStore = {
      ...tokenStore,
      async list() {
        listCount += 1;
        return tokenStore.list();
      },
    };
    const verifier = new TokenVerifier({ tokenStore: wrappedStore, pepper });
    await verifier.verify(created.raw.reveal());
    await verifier.verify(created.raw.reveal());
    await verifier.verify(created.raw.reveal());
    expect(listCount).toBe(1);
  });

  it('returns expired when the token has passed its expiresAt', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
      expiresInMs: 1,
      now: () => 1_700_000_000_000,
    });
    const verifier = new TokenVerifier({
      tokenStore,
      pepper,
      now: () => 1_700_000_000_000 + 60_000,
    });
    const result = await verifier.verify(created.raw.reveal());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('expired');
  });

  it('returns revoked once the token is revoked in the store', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    await tokenStore.revoke(created.record.id, new Date().toISOString());
    const verifier = new TokenVerifier({ tokenStore, pepper });
    const result = await verifier.verify(created.raw.reveal());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('revoked');
  });

  it('locks out an IP after the configured failure threshold', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    let now = 1_700_000_000_000;
    const verifier = new TokenVerifier({
      tokenStore,
      pepper,
      perIpFailureThreshold: 3,
      perIpWindowMs: 60_000,
      perIpLockoutMs: 30_000,
      now: () => now,
    });
    for (let i = 0; i < 3; i += 1) {
      now += 1_000;
      const result = await verifier.verify('garbage', { ip: '10.0.0.1' });
      expect(result.ok).toBe(false);
    }
    now += 100;
    const locked = await verifier.verify('garbage', { ip: '10.0.0.1' });
    expect(locked.ok).toBe(false);
    if (!locked.ok) {
      expect(locked.reason).toBe('ip-locked-out');
      expect(locked.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it('lifts the IP lockout once the window elapses', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    let now = 1_700_000_000_000;
    const verifier = new TokenVerifier({
      tokenStore,
      pepper,
      perIpFailureThreshold: 1,
      perIpWindowMs: 60_000,
      perIpLockoutMs: 5_000,
      now: () => now,
    });
    await verifier.verify('garbage', { ip: '10.0.0.2' });
    const locked = await verifier.verify('garbage', { ip: '10.0.0.2' });
    if (!locked.ok) expect(locked.reason).toBe('ip-locked-out');
    now += 6_000;
    const next = await verifier.verify('garbage', { ip: '10.0.0.2' });
    expect(next.ok).toBe(false);
    if (!next.ok) expect(next.reason).toBe('malformed');
  });

  it('locks out a token after enough revoked-failures', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    await tokenStore.revoke(created.record.id, new Date().toISOString());
    let now = 1_700_000_000_000;
    const verifier = new TokenVerifier({
      tokenStore,
      pepper,
      perTokenFailureThreshold: 3,
      perTokenWindowMs: 60_000,
      perIpFailureThreshold: 1_000_000,
      now: () => now,
    });
    const raw = created.raw.reveal();
    for (let i = 0; i < 3; i += 1) {
      now += 1_000;
      const r = await verifier.verify(raw);
      expect(r.ok).toBe(false);
    }
    now += 100;
    const locked = await verifier.verify(raw);
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.reason).toBe('token-locked-out');
  });

  it('throws TokenVerifyOverloadError when the cap is exceeded', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const verifier = new TokenVerifier({
      tokenStore,
      pepper,
      maxConcurrentVerify: 1,
    });
    expect(() => verifier._simulateOverloadForTesting()).toThrowError(TokenVerifyOverloadError);
  });

  it('functional verifyToken wrapper succeeds for a freshly issued token', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    const result = await verifyToken(created.raw.reveal(), { tokenStore, pepper });
    expect(result.ok).toBe(true);
  });

  it('authorize matches a granted scope', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    const verifier = new TokenVerifier({ tokenStore, pepper });
    const result = await verifier.verify(created.raw.reveal());
    expect(authorize(result, 'agents:read').ok).toBe(true);
  });

  it('authorize rejects an insufficient scope', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    const verifier = new TokenVerifier({ tokenStore, pepper });
    const result = await verifier.verify(created.raw.reveal());
    const auth = authorize(result, 'memory:write');
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.reason).toBe('insufficient-scope');
  });

  it('authorize maps a verify failure to unauthenticated', () => {
    const auth = authorize({ ok: false, reason: 'malformed' }, 'agents:read');
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.reason).toBe('unauthenticated');
  });

  it('status() snapshots size and lockouts', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const verifier = new TokenVerifier({
      tokenStore,
      pepper,
      perIpFailureThreshold: 1,
      now: () => 1_700_000_000_000,
    });
    await verifier.verify('garbage', { ip: '10.0.0.9' });
    const status = verifier.status();
    expect(status.perIpLockouts).toBeGreaterThan(0);
  });

  it('clearTokenLockout / clearIpLockout / invalidateAll lift cached state', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const verifier = new TokenVerifier({
      tokenStore,
      pepper,
      perIpFailureThreshold: 1,
      now: () => 1_700_000_000_000,
    });
    await verifier.verify('garbage', { ip: '10.0.0.10' });
    verifier.clearIpLockout('10.0.0.10');
    verifier.clearTokenLockout('no-such-id');
    verifier.invalidateAll();
    expect(verifier.status().perIpLockouts).toBe(0);
  });

  it('uses the pepper as a SecretValue without leaking it', async () => {
    // SPL-11: 'a'.repeat(32) is now refused as a placeholder - use a
    // realistic high-entropy pepper.
    const pepper = SecretValue.fromString('vRq8sJ2mKx0aZpW4uTn7eYb5cHd9fLg1');
    const tokenStore = createMemoryAuthTokenStore();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    const verifier = new TokenVerifier({ tokenStore, pepper });
    const result = await verifier.verify(created.raw.reveal());
    expect(result.ok).toBe(true);
    expect(`${pepper}`).toBe('[SECRET]');
  });
});

// --- SPL-19 - scale traps -------------------------------------------------------

describe('SPL-19 - verifier scale behaviour', () => {
  it('uses getByHash on cache-miss instead of walking list()', async () => {
    const pepper = SecretValue.fromString('vRq8sJ2mKx0aZpW4uTn7eYb5cHd9fLg1');
    const inner = createMemoryAuthTokenStore();
    const created = await createToken({
      tokenStore: inner,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    let byHashCalls = 0;
    const indexed = {
      put: inner.put.bind(inner),
      get: inner.get.bind(inner),
      revoke: inner.revoke.bind(inner),
      recordUse: inner.recordUse.bind(inner),
      list: async () => {
        throw new Error('full scan! the verifier must use getByHash when available');
      },
      getByHash: async (hashHex: string) => {
        byHashCalls += 1;
        const all = await inner.list();
        return all.find((r) => r.hashHex === hashHex) ?? null;
      },
    };
    const verifier = new TokenVerifier({ tokenStore: indexed, pepper });
    const raw = await created.raw.use(async (s) => s);
    expect((await verifier.verify(raw)).ok).toBe(true);
    expect(byHashCalls).toBe(1);
  });

  it('caps the per-IP failure map at maxTrackedIps', async () => {
    const pepper = SecretValue.fromString('vRq8sJ2mKx0aZpW4uTn7eYb5cHd9fLg1');
    const verifier = new TokenVerifier({
      tokenStore: createMemoryAuthTokenStore(),
      pepper,
      maxTrackedIps: 50,
    });
    for (let i = 0; i < 200; i++) {
      await verifier.verify('not-a-token', { ip: `2001:db8::${i.toString(16)}` });
    }
    // The rotating attacker cannot inflate the maps without bound.
    const status = verifier.status();
    expect(status.perIpFailures).toBeGreaterThan(0); // tracking IS happening
    expect(status.perIpFailures).toBeLessThanOrEqual(50); // ...but bounded
  });
});
