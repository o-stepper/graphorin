/**
 * Phase 03b DoD-conformance tests. Each test maps 1:1 to a line in
 * the Phase 03b acceptance criteria. The coverage-oriented unit
 * tests live alongside their modules; this file exists so that the
 * DoD itself is regression-protected.
 */

import type { AuthTokenRecord, AuthTokenStore } from '@graphorin/core/contracts';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  createToken,
  generatePepper,
  listTokens,
  revokeToken,
  rotatePepper,
  type TokenMetadata,
} from '../../src/auth/crud.js';
import { TokenVerifyOverloadError } from '../../src/auth/errors.js';
import { parseScope, SCOPE_CATALOGUE, scopeMatches } from '../../src/auth/scope.js';
import {
  parseToken,
  TOKEN_ENTROPY_BYTES,
  TOKEN_ENTROPY_LENGTH,
  verifyOffline,
} from '../../src/auth/token-format.js';
import { TokenVerifier, verifyToken } from '../../src/auth/verify.js';

import { createMemoryAuthTokenStore } from './_helpers.js';

describe('Phase 03b — DoD conformance', () => {
  describe('verifyOffline rejects malformed tokens without DB hit', () => {
    it('rejects wrong prefix without a single store call', async () => {
      const inner = createMemoryAuthTokenStore();
      let listCalls = 0;
      let getCalls = 0;
      const tokenStore: AuthTokenStore = {
        ...inner,
        async list() {
          listCalls += 1;
          return inner.list();
        },
        async get(id) {
          getCalls += 1;
          return inner.get(id);
        },
      };
      const verifier = new TokenVerifier({ tokenStore, pepper: generatePepper() });
      const result = await verifier.verify('xyz_live_v1_aaa_bbb');
      expect(result.ok).toBe(false);
      expect(listCalls).toBe(0);
      expect(getCalls).toBe(0);
    });

    it('rejects wrong length', () => {
      const r = verifyOffline('gph_live_v1_short_abc');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('invalid-entropy');
    });

    it('rejects a bad CRC checksum', () => {
      // 'A'.repeat(43) is a valid base62 entropy block; any 6-char
      // base62 checksum that is not the genuine CRC32 should fail.
      const malformed = `gph_live_v1_${'A'.repeat(43)}_000000`;
      const r = verifyOffline(malformed);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('invalid-checksum');
    });
  });

  describe('Scope catalogue conformance', () => {
    it('every catalogue entry is parseable', () => {
      for (const scope of SCOPE_CATALOGUE) {
        expect(() => parseScope(scope)).not.toThrow();
      }
    });

    it('admin:* matches every catalogue entry (DoD § scope superset)', () => {
      const grant = parseScope('admin:*');
      for (const scope of SCOPE_CATALOGUE) {
        const required = parseScope(scope);
        expect(scopeMatches(grant, required)).toBe(true);
      }
    });

    it('rejects malformed catalogue-shaped strings', () => {
      const negatives = [
        '',
        'agents',
        'agents:Read',
        'Agents:read',
        'agents:read:hello world',
        'agents:read:foo:bar',
        ':read',
        'agents::read',
      ];
      for (const neg of negatives) {
        expect(() => parseScope(neg)).toThrow();
      }
    });
  });

  describe('Per-IP rate limit at the documented defaults', () => {
    it('locks out an IP after 5 failures inside a 60 s window', async () => {
      const tokenStore = createMemoryAuthTokenStore();
      let now = 1_700_000_000_000;
      const verifier = new TokenVerifier({
        tokenStore,
        pepper: generatePepper(),
        now: () => now,
      });
      // 5 failures inside the 60-second window must trigger the lockout.
      for (let i = 0; i < 5; i += 1) {
        now += 1_000;
        const r = await verifier.verify('garbage', { ip: '198.51.100.1' });
        expect(r.ok).toBe(false);
      }
      now += 100;
      const locked = await verifier.verify('garbage', { ip: '198.51.100.1' });
      expect(locked.ok).toBe(false);
      if (!locked.ok) {
        expect(locked.reason).toBe('ip-locked-out');
        // Default lockout is 5 minutes (300_000 ms).
        expect(locked.retryAfterMs).toBeGreaterThan(0);
        if (locked.retryAfterMs !== undefined) {
          expect(locked.retryAfterMs).toBeLessThanOrEqual(5 * 60_000);
        }
      }
    });
  });

  describe('Per-token lockout is permanent at the documented defaults', () => {
    it('locks out a token after 10 failures inside a 5 min window', async () => {
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
        // Pin the per-IP threshold high so the IP lockout doesn't shadow
        // the per-token assertion (the verifier short-circuits on
        // ip-locked-out before consulting the per-token state).
        perIpFailureThreshold: 1_000_000,
        now: () => now,
      });
      const raw = created.raw.reveal();
      for (let i = 0; i < 10; i += 1) {
        now += 1_000;
        const r = await verifier.verify(raw);
        expect(r.ok).toBe(false);
      }
      // After 10 failures the lockout flips to permanent. Every
      // subsequent call short-circuits before the store lookup.
      now += 60_000;
      const after = await verifier.verify(raw);
      expect(after.ok).toBe(false);
      if (!after.ok) expect(after.reason).toBe('token-locked-out');

      // Walk far past the 5 min window — lockout still in force.
      now += 10 * 60_000;
      const stillLocked = await verifier.verify(raw);
      expect(stillLocked.ok).toBe(false);
      if (!stillLocked.ok) expect(stillLocked.reason).toBe('token-locked-out');
    });
  });

  describe('Global concurrent-verify cap', () => {
    it('throws TokenVerifyOverloadError when the in-flight cap is exceeded', async () => {
      const tokenStore = createMemoryAuthTokenStore();
      const pepper = generatePepper();
      const created = await createToken({
        tokenStore,
        pepper,
        env: 'live',
        scopes: ['agents:read'],
      });
      // Wrap the store so the first verify hangs forever; that pins
      // the in-flight counter at the cap and forces the second call
      // to throw synchronously.
      let release: () => void = () => undefined;
      const stall = new Promise<void>((resolve) => {
        release = resolve;
      });
      let listed = 0;
      const stallingStore: AuthTokenStore = {
        ...tokenStore,
        async list() {
          listed += 1;
          if (listed === 1) {
            await stall;
          }
          return tokenStore.list();
        },
      };
      const verifier = new TokenVerifier({
        tokenStore: stallingStore,
        pepper,
        maxConcurrentVerify: 1,
      });
      const raw = created.raw.reveal();
      const inflight = verifier.verify(raw); // hangs at the store list
      // Yield so the in-flight counter has been incremented before
      // we fire the second call.
      await Promise.resolve();
      await expect(verifier.verify(raw)).rejects.toBeInstanceOf(TokenVerifyOverloadError);
      release();
      const finished = await inflight;
      expect(finished.ok).toBe(true);
    });
  });

  describe('createToken entropy + roundtrip', () => {
    it('uses 32 bytes (256 bits) and the raw passes verifyOffline', async () => {
      expect(TOKEN_ENTROPY_BYTES).toBe(32);
      expect(TOKEN_ENTROPY_LENGTH).toBe(43);
      const tokenStore = createMemoryAuthTokenStore();
      const pepper = generatePepper();
      const created = await createToken({
        tokenStore,
        pepper,
        env: 'live',
        scopes: ['agents:read'],
      });
      const raw = created.raw.reveal();
      const offline = verifyOffline(raw);
      expect(offline.ok).toBe(true);
      const parsed = parseToken(raw);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(parsed.entropy.length).toBe(TOKEN_ENTROPY_LENGTH);
      }
    });
  });

  describe('rotatePepper dry-run', () => {
    it('returns the row count without mutating the store', async () => {
      const tokenStore = createMemoryAuthTokenStore();
      const pepper = generatePepper();
      const created = await createToken({
        tokenStore,
        pepper,
        env: 'live',
        scopes: ['agents:read'],
      });
      const before = await tokenStore.list();
      const result = await rotatePepper({
        tokenStore,
        newPepper: generatePepper(),
        oldHashLookup: async () => created.record.hashHex,
        recomputeHash: async () => 'replacement-hash',
        dryRun: true,
      });
      expect(result.updated).toBe(1);
      expect(result.skipped).toBe(0);
      const after = await tokenStore.list();
      expect(after).toEqual(before);
    });
  });

  describe('Brute-force regression', () => {
    it('1000 random tokens never authenticate against an unknown pepper', async () => {
      const tokenStore = createMemoryAuthTokenStore();
      const pepper = generatePepper();
      const known = await createToken({
        tokenStore,
        pepper,
        env: 'live',
        scopes: ['agents:read'],
      });
      const verifier = new TokenVerifier({ tokenStore, pepper });
      // Sanity: the known token verifies.
      const sane = await verifier.verify(known.raw.reveal());
      expect(sane.ok).toBe(true);

      // 1000 unrelated tokens issued under a different pepper must
      // never produce ok=true. Run at the disabled rate-limit so the
      // verifier exercises the HMAC path on every iteration.
      const looseVerifier = new TokenVerifier({
        tokenStore,
        pepper,
        perIpFailureThreshold: 1_000_000,
      });
      let unauthorised = 0;
      for (let i = 0; i < 1000; i += 1) {
        const intruder = await createToken({
          tokenStore: createMemoryAuthTokenStore(),
          pepper: generatePepper(),
          env: 'live',
          scopes: ['agents:read'],
        });
        const result = await looseVerifier.verify(intruder.raw.reveal());
        if (!result.ok) unauthorised += 1;
      }
      expect(unauthorised).toBe(1000);
    });
  });

  describe('Integration: token create → verify → revoke → re-verify', () => {
    it('rejects re-verification once the token is revoked', async () => {
      const tokenStore = createMemoryAuthTokenStore();
      const pepper = generatePepper();
      const created = await createToken({
        tokenStore,
        pepper,
        env: 'live',
        scopes: ['agents:invoke'],
        label: 'cli',
      });
      // Verify it first via the functional helper.
      const first = await verifyToken(created.raw.reveal(), { tokenStore, pepper });
      expect(first.ok).toBe(true);

      // Revoke and confirm metadata reflects the revocation.
      const revoked = await revokeToken(tokenStore, created.record.id);
      expect(revoked?.revokedAt).toBeDefined();
      const visible = await listTokens(tokenStore);
      expect(visible.find((t) => t.id === created.record.id)).toBeUndefined();

      // Re-verify against a fresh verifier so the warm-cache does
      // not mask the revocation; the result must be ok=false.
      const freshVerifier = new TokenVerifier({ tokenStore, pepper });
      const second = await freshVerifier.verify(created.raw.reveal());
      expect(second.ok).toBe(false);
      if (!second.ok) expect(second.reason).toBe('revoked');
    });
  });

  describe('AuthTokenStore contract is type-tested', () => {
    it('createMemoryAuthTokenStore matches the AuthTokenStore contract', () => {
      const store = createMemoryAuthTokenStore();
      expectTypeOf(store).toMatchTypeOf<AuthTokenStore>();
    });

    it('AuthTokenRecord shape matches the record returned by createToken', async () => {
      const tokenStore = createMemoryAuthTokenStore();
      const pepper = generatePepper();
      const created = await createToken({
        tokenStore,
        pepper,
        env: 'live',
        scopes: ['agents:read'],
      });
      expectTypeOf(created.record).toMatchTypeOf<AuthTokenRecord>();
    });

    it('listTokens returns the public TokenMetadata projection (no hashHex)', async () => {
      const tokenStore = createMemoryAuthTokenStore();
      const pepper = generatePepper();
      await createToken({
        tokenStore,
        pepper,
        env: 'live',
        scopes: ['agents:read'],
      });
      const listed = await listTokens(tokenStore);
      expectTypeOf(listed).toMatchTypeOf<ReadonlyArray<TokenMetadata>>();
      expect((listed[0] as Record<string, unknown>).hashHex).toBeUndefined();
    });
  });
});
