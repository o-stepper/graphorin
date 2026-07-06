/**
 * W-011: audit-chain fencing. With a `transact` fence the
 * read-modify-write of appendAudit and the delete+rewrite of pruneAudit
 * run atomically; without it, append retries seq collisions instead of
 * dropping entries, and prune fails closed.
 */

import { describe, expect, it } from 'vitest';

import { appendAudit } from '../../src/audit/append.js';
import type { AuditDb } from '../../src/audit/audit-db.js';
import { pruneAudit } from '../../src/audit/prune.js';
import type { AuditEntryInput, StoredAuditEntry } from '../../src/audit/types.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import { createMemoryAuditDb, createMemoryAuditDbWithoutTransact } from './_helpers.js';

const INPUT: AuditEntryInput = {
  actor: { kind: 'system', id: 'test' },
  action: 'secrets:read',
  target: 'secret:x',
  decision: 'success',
};

describe('appendAudit fencing (W-011)', () => {
  it('wraps the read-modify-write in transact when the binding provides it', async () => {
    const base = createMemoryAuditDb();
    let transactCalls = 0;
    const db: AuditDb = {
      ...base,
      async transact(fn) {
        transactCalls += 1;
        return fn();
      },
    };
    await appendAudit(db, INPUT);
    await appendAudit(db, INPUT);
    expect(transactCalls).toBe(2);
    const verdict = await verifyAuditChain(db);
    expect(verdict.ok).toBe(true);
  });

  it('without transact: a cross-process seq collision is retried, not dropped', async () => {
    const base = createMemoryAuditDbWithoutTransact();
    // Simulate a foreign process winning the race once: the first
    // insert throws the UNIQUE/PK shape better-sqlite3 produces, and a
    // "foreign" entry appears at that seq so the retry must re-read.
    let injected = false;
    const db: AuditDb = {
      ...base,
      async insert(entry: StoredAuditEntry) {
        if (!injected && entry.seq === 2) {
          injected = true;
          // The foreign writer's row is already there.
          await base.insert(entry);
          const err = new Error('UNIQUE constraint failed: audit_log.seq') as Error & {
            code: string;
          };
          err.code = 'SQLITE_CONSTRAINT_PRIMARYKEY';
          throw err;
        }
        return base.insert(entry);
      },
    };
    await appendAudit(db, INPUT);
    const second = await appendAudit(db, INPUT);
    // The losing writer re-read the tip and appended AFTER the foreign
    // row instead of vanishing with a console.warn.
    expect(second.seq).toBe(3);
    expect(await db.count()).toBe(3);
    const verdict = await verifyAuditChain(db);
    expect(verdict.ok).toBe(true);
  });

  it('without transact: non-conflict errors propagate immediately', async () => {
    const base = createMemoryAuditDbWithoutTransact();
    let attempts = 0;
    const db: AuditDb = {
      ...base,
      async insert() {
        attempts += 1;
        throw new Error('disk I/O error');
      },
    };
    await expect(appendAudit(db, INPUT)).rejects.toThrow('disk I/O error');
    expect(attempts).toBe(1);
  });
});

describe('pruneAudit fencing (W-011)', () => {
  it('runs the whole delete+rewrite in ONE transaction', async () => {
    const base = createMemoryAuditDb();
    let transactCalls = 0;
    const db: AuditDb = {
      ...base,
      async transact(fn) {
        transactCalls += 1;
        return fn();
      },
    };
    for (let i = 0; i < 5; i += 1) {
      await appendAudit(db, { ...INPUT, ts: 1000 + i });
    }
    transactCalls = 0;
    const result = await pruneAudit(db, { before: 1003, retain: 1 });
    expect(result.deleted).toBe(3);
    expect(transactCalls).toBe(1);
    const verdict = await verifyAuditChain(db);
    expect(verdict.ok).toBe(true);
  });

  it('fails closed on a binding without transact', async () => {
    const db = createMemoryAuditDbWithoutTransact();
    await appendAudit(db, { ...INPUT, ts: 1000 });
    await expect(pruneAudit(db, { before: 2000 })).rejects.toThrow(/transact/);
    // Nothing was deleted by the refused prune.
    expect(await db.count()).toBe(1);
  });
});
