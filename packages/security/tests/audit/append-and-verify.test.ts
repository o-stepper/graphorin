import { describe, expect, it } from 'vitest';

import { appendAudit, computeAuditHash, GENESIS_PREV_HASH } from '../../src/audit/append.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';

import { createMemoryAuditDb } from './_helpers.js';

describe('@graphorin/security/audit — appendAudit + verifyAuditChain', () => {
  it('appends a single entry with the genesis prev hash', async () => {
    const db = createMemoryAuditDb();
    const entry = await appendAudit(db, {
      actor: { kind: 'system', id: 'graphorin' },
      action: 'audit:db-opened',
      target: 'audit.db',
      decision: 'success',
    });
    expect(entry.seq).toBe(1);
    expect(entry.prevHash).toBe(GENESIS_PREV_HASH);
    expect(entry.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('chains 1000 entries cleanly', async () => {
    const db = createMemoryAuditDb();
    for (let i = 0; i < 1000; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `KEY_${i}`,
        decision: 'success',
        ts: 1_700_000_000_000 + i,
      });
    }
    const result = await verifyAuditChain(db);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.count).toBe(1000);
  });

  it('detects a single-row tamper', async () => {
    const db = createMemoryAuditDb();
    for (let i = 0; i < 5; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `KEY_${i}`,
        decision: 'success',
        ts: 1_700_000_000_000 + i,
      });
    }
    type StoredEntry = Awaited<ReturnType<typeof db.latest>>;
    const rows: NonNullable<StoredEntry>[] = [];
    for await (const row of db.iterate()) rows.push(row);
    const target = rows[2];
    if (target === undefined) throw new Error('missing row');
    await db.replaceEntry({ ...target, prevHash: '0'.repeat(64) });
    const result = await verifyAuditChain(db);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.brokenAt).toBe(target.seq);
  });

  it('detects a hash-only tamper (mutated metadata)', async () => {
    const db = createMemoryAuditDb();
    for (let i = 0; i < 3; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `KEY_${i}`,
        decision: 'success',
        ts: 1_700_000_000_000 + i,
      });
    }
    type StoredEntry = Awaited<ReturnType<typeof db.latest>>;
    const rows: NonNullable<StoredEntry>[] = [];
    for await (const row of db.iterate()) rows.push(row);
    const target = rows[1];
    if (target === undefined) throw new Error('missing row');
    await db.replaceEntry({ ...target, target: 'TAMPERED' });
    const result = await verifyAuditChain(db);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.brokenAt).toBe(target.seq);
  });

  it('computeAuditHash matches appendAudit for the same input', async () => {
    const db = createMemoryAuditDb();
    const entry = await appendAudit(db, {
      actor: { kind: 'system', id: 'graphorin' },
      action: 'secret:get',
      target: 'KEY_X',
      decision: 'success',
      ts: 1_700_000_000_000,
    });
    const recomputed = computeAuditHash({
      seq: entry.seq,
      ts: entry.ts,
      actor: entry.actor,
      action: entry.action,
      target: entry.target,
      decision: entry.decision,
      prevHash: entry.prevHash,
    });
    expect(recomputed).toBe(entry.hash);
  });

  it('verifyAuditChain returns ok on an empty chain', async () => {
    const db = createMemoryAuditDb();
    const result = await verifyAuditChain(db);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.count).toBe(0);
  });
});
