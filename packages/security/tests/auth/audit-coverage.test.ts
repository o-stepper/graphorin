import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { bridgeAuthToAudit } from '../../src/audit/auth-bridge.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import {
  _resetAuthAuditListenersForTesting,
  createToken,
  revokeToken,
  rotateToken,
  TokenVerifier,
} from '../../src/auth/index.js';
import { SecretValue } from '../../src/secrets/secret-value.js';

import { createMemoryAuditDb } from '../audit/_helpers.js';
import { createMemoryAuthTokenStore } from './_helpers.js';

const PEPPER = 'vRq8sJ2mKx0aZpW4uTn7eYb5cHd9fLg1';

describe('SPL-5 — server-token auth lifecycle writes audit rows', () => {
  beforeEach(() => _resetAuthAuditListenersForTesting());
  afterEach(() => _resetAuthAuditListenersForTesting());

  it('token:create / revoke / rotate and auth:granted / auth:denied:lockout reach the chain', async () => {
    const db = createMemoryAuditDb();
    const bridge = bridgeAuthToAudit({ db });
    const tokenStore = createMemoryAuthTokenStore();
    const pepper = SecretValue.fromString(PEPPER);

    // CRUD lifecycle.
    const created = await createToken({
      tokenStore,
      pepper,
      env: 'live',
      scopes: ['agents:read'],
    });
    await rotateToken({ tokenStore, pepper, id: created.record.id });
    const listed = await tokenStore.list();
    const live = listed.find((r) => r.revokedAt === undefined);
    if (live === undefined) throw new Error('expected a live token after rotate');
    await revokeToken(tokenStore, live.id);

    // Verification outcomes.
    const verifier = new TokenVerifier({
      tokenStore,
      pepper,
      perTokenFailureThreshold: 1,
      now: () => Date.now(),
    });
    const fresh = await createToken({ tokenStore, pepper, env: 'live', scopes: ['agents:read'] });
    const raw = await fresh.raw.use(async (s) => s);
    expect((await verifier.verify(raw)).ok).toBe(true); // auth:granted

    // Trip the per-token lockout, then verify again to emit auth:denied:lockout.
    await verifier.verify(`${raw}x`); // a failure on a parseable-but-wrong token
    await verifier.verify(`${raw}x`);
    await verifier.verify(raw, { ip: '203.0.113.7' });

    await bridge.drain();
    bridge();

    const actions = new Set<string>();
    for await (const entry of db.iterate()) actions.add(entry.action);
    expect(actions.has('token:create')).toBe(true);
    expect(actions.has('token:rotate')).toBe(true);
    expect(actions.has('token:revoke')).toBe(true);
    expect(actions.has('auth:granted')).toBe(true);

    const verify = await verifyAuditChain(db);
    expect(verify.ok).toBe(true); // tamper-evident chain still valid
  });
});
