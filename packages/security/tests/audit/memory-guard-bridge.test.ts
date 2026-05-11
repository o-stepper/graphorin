import { afterEach, describe, expect, it } from 'vitest';
import { bridgeMemoryGuardToAudit } from '../../src/audit/memory-guard-bridge.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import {
  _resetMemoryGuardAuditListenersForTesting,
  emitMemoryGuardAudit,
} from '../../src/guard/audit-emitter.js';
import { createMemoryAuditDb } from './_helpers.js';

describe('bridgeMemoryGuardToAudit', () => {
  afterEach(() => _resetMemoryGuardAuditListenersForTesting());

  it('translates a guard event into a chained audit entry', async () => {
    const db = createMemoryAuditDb();
    bridgeMemoryGuardToAudit({ db });
    emitMemoryGuardAudit({
      action: 'memory:guard:mismatch',
      decision: 'denied',
      ts: 1_700_000_000_000,
      tier: 'untrusted',
      regions: ['session', 'semantic'],
      actor: { kind: 'tool', toolName: 'risky.tool', runId: 'r1' },
    });
    await new Promise((r) => setImmediate(r));
    expect(await db.count()).toBe(1);
    const verify = await verifyAuditChain(db);
    expect(verify.ok).toBe(true);
    const rows: { action: string; target: string; decision: string }[] = [];
    for await (const row of db.iterate()) {
      rows.push({ action: row.action, target: row.target, decision: row.decision });
    }
    expect(rows[0]).toMatchObject({
      action: 'memory:guard:mismatch',
      target: 'session,semantic',
      decision: 'denied',
    });
  });

  it('synthesises a system actor when none is provided', async () => {
    const db = createMemoryAuditDb();
    bridgeMemoryGuardToAudit({ db });
    emitMemoryGuardAudit({
      action: 'memory:guard:verified',
      decision: 'success',
      ts: 1_700_000_000_000,
      tier: 'unknown',
    });
    await new Promise((r) => setImmediate(r));
    const rows: { actor: { kind: string; id: string } }[] = [];
    for await (const row of db.iterate()) {
      rows.push({ actor: row.actor as { kind: string; id: string } });
    }
    expect(rows[0]?.actor).toMatchObject({ kind: 'system', id: 'graphorin/security' });
  });

  it('uses the tier name as target when no regions are recorded', async () => {
    const db = createMemoryAuditDb();
    bridgeMemoryGuardToAudit({ db });
    emitMemoryGuardAudit({
      action: 'memory:guard:snapshot',
      decision: 'success',
      ts: 1_700_000_000_000,
      tier: 'memory-aware',
    });
    await new Promise((r) => setImmediate(r));
    const rows: { target: string }[] = [];
    for await (const row of db.iterate()) {
      rows.push({ target: row.target });
    }
    expect(rows[0]?.target).toBe('memory-aware');
  });

  it('writes both memory:modification:before and :after rows through appendAudit (DoD)', async () => {
    const { createAuditOnlyGuard } = await import('../../src/guard/audit-only-guard.js');
    const { createReader } = await import('../guard/_helpers.js');
    const db = createMemoryAuditDb();
    const teardown = bridgeMemoryGuardToAudit({ db });
    const guard = createAuditOnlyGuard({ actor: { kind: 'tool', toolName: 'fixture' } });
    const { reader } = createReader({ session: 'A', semantic: 'B' });
    const snap = await guard.snapshot(reader);
    await guard.verify(snap, reader);
    // Drain the serialised bridge queue.
    await teardown.drain();
    const rows: Array<{ action: string; decision: string }> = [];
    for await (const row of db.iterate()) {
      rows.push({ action: row.action, decision: row.decision });
    }
    const actions = rows.map((r) => r.action);
    expect(actions).toContain('memory:modification:before');
    expect(actions).toContain('memory:modification:after');
    // Chain still verifies clean.
    const verify = await verifyAuditChain(db);
    expect(verify.ok).toBe(true);
  });
});
