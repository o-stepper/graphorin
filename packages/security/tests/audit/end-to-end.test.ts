/**
 * Phase 03b end-to-end smoke: secrets-layer SecretsStore operation
 * → secretsAuditEmitter event → bridgeSecretsToAudit listener →
 * audit_log row → verifyAuditChain green.
 *
 * The DoD line is "All operations subscribe to secretsAuditEmitter
 * from Phase 03a — verified by emitting a fixture event and asserting
 * audit_log row." This test exercises a *real* SecretsStore call in
 * place of a fixture event so the cross-cut between the two
 * sub-phases is regression-protected.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { bridgeSecretsToAudit } from '../../src/audit/secrets-bridge.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import {
  _resetSecretsAuditListenersForTesting,
  type SecretsAuditAction,
} from '../../src/secrets/audit-emitter.js';
import { MemorySecretsStore } from '../../src/secrets/stores/memory.js';

import { createMemoryAuditDb } from './_helpers.js';

describe('Phase 03b — end-to-end secrets → audit smoke', () => {
  beforeEach(() => {
    _resetSecretsAuditListenersForTesting();
  });
  afterEach(() => {
    _resetSecretsAuditListenersForTesting();
  });

  it('a real SecretsStore.set/get/delete sequence produces a verifiable chain', async () => {
    const db = createMemoryAuditDb();
    bridgeSecretsToAudit({ db });

    const store = new MemorySecretsStore();
    await store.set('OPENAI_KEY', 'placeholder');
    const value = await store.get('OPENAI_KEY');
    expect(value).not.toBeNull();
    await store.delete('OPENAI_KEY');

    // Bridge writes are queued asynchronously — flush microtasks.
    await new Promise((resolve) => setImmediate(resolve));

    expect(await db.count()).toBe(3);
    const seen: SecretsAuditAction[] = [];
    for await (const entry of db.iterate()) {
      seen.push(entry.action as SecretsAuditAction);
    }
    expect(seen).toEqual(['secret:set', 'secret:get', 'secret:delete']);

    const verify = await verifyAuditChain(db);
    expect(verify.ok).toBe(true);
  });
});
