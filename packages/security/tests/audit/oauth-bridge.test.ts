import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { bridgeOAuthToAudit } from '../../src/audit/oauth-bridge.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import {
  _resetOAuthAuditListenersForTesting,
  emitOAuthAudit,
} from '../../src/oauth/audit-emitter.js';

import { createMemoryAuditDb } from './_helpers.js';

describe('@graphorin/security/audit - oauth-bridge', () => {
  beforeEach(() => {
    _resetOAuthAuditListenersForTesting();
  });
  afterEach(() => {
    _resetOAuthAuditListenersForTesting();
  });

  it('translates an OAuth event into an audit-log entry', async () => {
    const db = createMemoryAuditDb();
    const teardown = bridgeOAuthToAudit({ db });
    emitOAuthAudit({
      action: 'oauth:granted',
      decision: 'success',
      ts: 1_700_000_000_000,
      source: 'oauth',
      target: 'mcp:linear-mcp',
      metadata: { scopes: ['read', 'write'] },
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(await db.count()).toBe(1);
    const verify = await verifyAuditChain(db);
    expect(verify.ok).toBe(true);
    teardown();
  });

  it('falls back to a system actor when omitted', async () => {
    const db = createMemoryAuditDb();
    bridgeOAuthToAudit({ db });
    emitOAuthAudit({
      action: 'oauth:refreshed',
      decision: 'success',
      ts: 1_700_000_000_000,
      source: 'oauth',
      target: 'mcp:linear-mcp',
    });
    await new Promise((resolve) => setImmediate(resolve));
    let actor = '';
    for await (const entry of db.iterate()) {
      actor = entry.actor.kind;
    }
    expect(actor).toBe('system');
  });

  it('isolates write failures via the onWriteError callback', async () => {
    const failingDb = {
      ...createMemoryAuditDb(),
      async insert(): Promise<never> {
        throw new Error('disk full');
      },
    };
    const errors: unknown[] = [];
    bridgeOAuthToAudit({
      db: failingDb,
      onWriteError: (_event, error) => errors.push(error),
    });
    emitOAuthAudit({
      action: 'oauth:granted',
      decision: 'success',
      ts: 1,
      source: 'oauth',
      target: 'mcp:test',
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(errors.length).toBe(1);
  });
});
