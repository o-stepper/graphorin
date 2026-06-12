import { describe, expect, it } from 'vitest';

import {
  createToken,
  generatePepper,
  listTokens,
  rekeyTokens,
  revokeToken,
  rotatePepper,
  rotateToken,
} from '../../src/auth/crud.js';
import { ScopeParseError, WeakPepperError } from '../../src/auth/errors.js';
import { parseToken } from '../../src/auth/token-format.js';
import { TokenVerifier } from '../../src/auth/verify.js';
import { SecretValue } from '../../src/secrets/secret-value.js';

import { createMemoryAuthTokenStore } from './_helpers.js';

describe('@graphorin/security/auth — token CRUD', () => {
  it('creates a token whose plaintext parses successfully', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
      label: 'test',
    });
    expect(SecretValue.isSecretValue(created.raw)).toBe(true);
    const raw = created.raw.reveal();
    const parsed = parseToken(raw);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.env).toBe('live');
    expect(created.record.label).toBe('test');
  });

  it('rejects a malformed scope at creation', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    await expect(
      createToken({
        tokenStore,
        pepper,
        env: 'live',
        scopes: ['NOT A SCOPE'],
      }),
    ).rejects.toBeInstanceOf(ScopeParseError);
  });

  it('records expiresAt when expiresInMs is supplied', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
      expiresInMs: 60_000,
      now: () => 1_700_000_000_000,
    });
    expect(created.record.expiresAt).toBe(new Date(1_700_000_000_000 + 60_000).toISOString());
  });

  it('rejects negative expiresInMs', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    await expect(
      createToken({
        tokenStore,
        pepper,
        env: 'live',
        scopes: ['agents:read'],
        expiresInMs: -1,
      }),
    ).rejects.toBeInstanceOf(RangeError);
  });

  it('listTokens hides revoked entries by default', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
      label: 'live',
    });
    expect((await listTokens(tokenStore)).length).toBe(1);
    await revokeToken(tokenStore, created.record.id);
    expect((await listTokens(tokenStore)).length).toBe(0);
    expect((await listTokens(tokenStore, { includeRevoked: true })).length).toBe(1);
  });

  it('revokeToken returns undefined for unknown ids', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const result = await revokeToken(tokenStore, 'unknown');
    expect(result).toBeUndefined();
  });

  it('revokeToken is idempotent on already-revoked tokens', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    const first = await revokeToken(tokenStore, created.record.id);
    const second = await revokeToken(tokenStore, created.record.id);
    expect(first?.revokedAt).toBeDefined();
    expect(second?.revokedAt).toBe(first?.revokedAt);
  });

  it('rotateToken revokes the old and mints a new with the same scopes', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read', 'memory:write'],
      label: 'rotate-me',
    });
    const rotated = await rotateToken({
      tokenStore,
      pepper,
      id: created.record.id,
    });
    expect(rotated.old.revokedAt).toBeDefined();
    expect(rotated.next.record.scopes).toEqual(['agents:read', 'memory:write']);
    expect(rotated.next.record.id).not.toBe(created.record.id);
    expect(rotated.next.record.label).toBeUndefined();
  });

  it('rotateToken throws on unknown id', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    await expect(rotateToken({ tokenStore, pepper, id: 'no-such' })).rejects.toThrow(
      /unknown token id/,
    );
  });

  it('rotatePepper updates the hashHex of every row in dryRun=false', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const oldPepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper: oldPepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    const newPepper = generatePepper();
    const result = await rotatePepper({
      tokenStore,
      newPepper,
      oldHashLookup: async (id) => (id === created.record.id ? created.record.hashHex : null),
      recomputeHash: async (_id, oldHashHex) => `${oldHashHex}-rotated`,
    });
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    const updated = await tokenStore.get(created.record.id);
    expect(updated?.hashHex).toBe(`${created.record.hashHex}-rotated`);
  });

  it('rotatePepper(dryRun=true) leaves the store unchanged', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const oldPepper = generatePepper();
    const created = await createToken({
      tokenStore,
      pepper: oldPepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    const newPepper = generatePepper();
    const result = await rotatePepper({
      tokenStore,
      newPepper,
      oldHashLookup: async () => created.record.hashHex,
      recomputeHash: async () => 'whatever',
      dryRun: true,
    });
    expect(result.updated).toBe(1);
    const refreshed = await tokenStore.get(created.record.id);
    expect(refreshed?.hashHex).toBe(created.record.hashHex);
  });

  it('rotatePepper rejects a sub-32-byte pepper', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const weak = SecretValue.fromString('short');
    await expect(
      rotatePepper({
        tokenStore,
        newPepper: weak,
        oldHashLookup: async () => null,
        recomputeHash: async () => null,
      }),
    ).rejects.toBeInstanceOf(WeakPepperError);
  });

  it('rotatePepper skips rows for which the lookup returns null', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    const result = await rotatePepper({
      tokenStore,
      newPepper: pepper,
      oldHashLookup: async () => null,
      recomputeHash: async () => 'never',
    });
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('rekeyTokens revokes every active token and issues fresh raws', async () => {
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = generatePepper();
    const a = await createToken({ tokenStore, pepper, env: 'live', scopes: ['agents:read'] });
    const b = await createToken({ tokenStore, pepper, env: 'live', scopes: ['memory:read'] });
    await revokeToken(tokenStore, b.record.id);
    const rekeyed = await rekeyTokens({ tokenStore, pepper, env: 'live' });
    expect(rekeyed.size).toBe(1);
    const next = rekeyed.get(a.record.id);
    expect(next).toBeDefined();
    if (next === undefined) throw new Error('unreachable');
    expect(next.record.scopes).toEqual(['agents:read']);
  });
});

// --- SPL-8/9/11 — secrets-hygiene batch ----------------------------------------

describe('SPL-11 — weak peppers are rejected wherever a pepper is consumed', () => {
  it('createToken throws WeakPepperError for a 1-byte pepper', async () => {
    const store = createMemoryAuthTokenStore();
    await expect(
      createToken({
        tokenStore: store,
        pepper: SecretValue.fromString('x'),
        env: 'live',
        scopes: ['runs:read'],
      }),
    ).rejects.toBeInstanceOf(WeakPepperError);
  });
});

describe('SPL-9 — revocation invalidates the verifier cache immediately', () => {
  it('a revoked token fails verification at once when the verifier is passed', async () => {
    const store = createMemoryAuthTokenStore();
    const pepper = SecretValue.fromString('a-sufficiently-long-pepper-value-123456');
    const created = await createToken({
      tokenStore: store,
      pepper,
      env: 'live',
      scopes: ['runs:read'],
    });
    const verifier = new TokenVerifier({ tokenStore: store, pepper });
    const raw = await created.raw.use(async (s) => s);
    expect((await verifier.verify(raw)).ok).toBe(true); // warm the cache
    await revokeToken(store, created.record.id, { verifier });
    expect((await verifier.verify(raw)).ok).toBe(false); // no 60s cache window
  });
});
