import { describe, expect, it } from 'vitest';

import { appendAudit } from '../../src/audit/append.js';
import type { AuditDb } from '../../src/audit/audit-db.js';
import type { StoredAuditEntry } from '../../src/audit/types.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';

/**
 * Strict in-memory `AuditDb` that faithfully models the real SQLite
 * schema for SPL-4: `seq INTEGER PRIMARY KEY` is UNIQUE, so a second
 * insert of an already-used `seq` throws (the loose `_helpers.ts`
 * fixture pushes duplicates and thereby masks the race). Both
 * `latest()` and `insert()` yield a microtask so concurrent
 * `appendAudit` calls actually interleave their read-modify-write.
 */
function createStrictAuditDb(): AuditDb {
  const rows: StoredAuditEntry[] = [];
  return {
    binding: 'memory-strict',
    path: ':memory:',
    async insert(entry) {
      await Promise.resolve();
      if (rows.some((r) => r.seq === entry.seq)) {
        throw new Error(`UNIQUE constraint failed: audit.seq (${entry.seq})`);
      }
      rows.push(entry);
      return entry;
    },
    async latest() {
      await Promise.resolve();
      return rows[rows.length - 1];
    },
    async *iterate(bounds) {
      const fromSeq = bounds?.fromSeq ?? -Infinity;
      const toSeq = bounds?.toSeq ?? Infinity;
      for (const row of [...rows].sort((a, b) => a.seq - b.seq)) {
        if (row.seq < fromSeq || row.seq > toSeq) continue;
        yield row;
      }
    },
    async count() {
      return rows.length;
    },
    async deleteUpTo() {
      return 0;
    },
    async replaceEntry() {
      /* unused */
    },
    async close() {
      rows.length = 0;
    },
  };
}

const INPUT = (i: number) =>
  ({
    actor: { kind: 'system', id: 'graphorin/security' },
    action: 'secret:get',
    target: `key-${i}`,
    decision: 'success',
  }) as const;

describe('appendAudit - concurrent writers serialise on one AuditDb (SPL-4)', () => {
  it('N concurrent appendAudit calls produce exactly N contiguous seqs with an intact chain', async () => {
    const db = createStrictAuditDb();
    const N = 16;

    // BUG (pre-fix): appendAudit reads db.latest() then inserts with an
    // await gap between, and nothing serialises across callers - so
    // concurrent calls read the same `last`, compute the same `seq`, and
    // the UNIQUE PK rejects all but one. Writes are lost (silent drop in
    // production, where the rejection routes to an optional onWriteError).
    const results = await Promise.allSettled(
      Array.from({ length: N }, (_, i) => appendAudit(db, INPUT(i))),
    );

    // No dropped writes: every append settled fulfilled.
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBe(N);

    // Exactly N rows with contiguous, unique seqs 1..N.
    const seqs: number[] = [];
    for await (const entry of db.iterate()) seqs.push(entry.seq);
    expect(seqs).toEqual(Array.from({ length: N }, (_, i) => i + 1));

    // The hash chain links cleanly end-to-end.
    const verdict = await verifyAuditChain(db);
    expect(verdict.ok).toBe(true);
    if (verdict.ok) expect(verdict.count).toBe(N);
  });
});
