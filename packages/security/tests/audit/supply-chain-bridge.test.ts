import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { bridgeSupplyChainToAudit } from '../../src/audit/supply-chain-bridge.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import {
  _resetSupplyChainAuditListenersForTesting,
  emitSupplyChainAudit,
} from '../../src/supply-chain/audit-emitter.js';

import { createMemoryAuditDb } from './_helpers.js';

describe('@graphorin/security/audit — supply-chain-bridge', () => {
  beforeEach(() => {
    _resetSupplyChainAuditListenersForTesting();
  });
  afterEach(() => {
    _resetSupplyChainAuditListenersForTesting();
  });

  it('translates a supply-chain event into an audit-log entry', async () => {
    const db = createMemoryAuditDb();
    bridgeSupplyChainToAudit({ db });
    emitSupplyChainAudit({
      action: 'skill:installed',
      decision: 'success',
      ts: 1_700_000_000_000,
      source: 'skills-supply-chain',
      target: 'skill:@vendor/x@1.2.3',
      metadata: { trustLevel: 'untrusted', ignoreScripts: true, signatureVerified: true },
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(await db.count()).toBe(1);
    const verify = await verifyAuditChain(db);
    expect(verify.ok).toBe(true);
  });

  it('records denials', async () => {
    const db = createMemoryAuditDb();
    bridgeSupplyChainToAudit({ db });
    emitSupplyChainAudit({
      action: 'skill:install-denied',
      decision: 'denied',
      ts: 1,
      source: 'skills-supply-chain',
      target: 'skill:@evil/x',
      metadata: { reason: '@evil/*' },
    });
    await new Promise((resolve) => setImmediate(resolve));
    let captured: string | undefined;
    for await (const entry of db.iterate()) captured = entry.decision;
    expect(captured).toBe('denied');
  });

  it('isolates write errors', async () => {
    const failing = {
      ...createMemoryAuditDb(),
      async insert(): Promise<never> {
        throw new Error('boom');
      },
    };
    const errs: unknown[] = [];
    bridgeSupplyChainToAudit({ db: failing, onWriteError: (_e, err) => errs.push(err) });
    emitSupplyChainAudit({
      action: 'skill:installed',
      decision: 'success',
      ts: 1,
      source: 'skills-supply-chain',
      target: 'x',
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(errs.length).toBe(1);
  });
});
