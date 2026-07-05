import { Buffer } from 'node:buffer';

import type { AuditDb, AuditDbBinding, OpenAuditDbOptions } from '../../src/audit/audit-db.js';
import {
  AuditDbCipherUnavailableError,
  AuditPayloadSerializationError,
} from '../../src/audit/errors.js';
import type { StoredAuditEntry } from '../../src/audit/types.js';

void AuditDbCipherUnavailableError;
void AuditPayloadSerializationError;
void Buffer;

/** In-memory audit-db for tests. */
export function createMemoryAuditDb(): AuditDb {
  const rows: StoredAuditEntry[] = [];
  return {
    binding: 'memory',
    path: ':memory:',
    async insert(entry) {
      rows.push(entry);
      return entry;
    },
    async latest() {
      return rows[rows.length - 1];
    },
    async *iterate(bounds) {
      const fromSeq = bounds?.fromSeq ?? -Infinity;
      const toSeq = bounds?.toSeq ?? Infinity;
      for (const row of rows) {
        if (row.seq < fromSeq || row.seq > toSeq) continue;
        yield row;
      }
    },
    async count() {
      return rows.length;
    },
    async deleteUpTo(threshold) {
      let removed = 0;
      while (rows.length > 0) {
        const head = rows[0];
        if (head === undefined || head.seq > threshold) break;
        rows.shift();
        removed += 1;
      }
      return removed;
    },
    async replaceEntry(entry) {
      const idx = rows.findIndex((r) => r.seq === entry.seq);
      if (idx === -1) return;
      rows[idx] = Object.freeze({ ...entry });
    },
    // W-011: single-threaded in-memory fake - a passthrough transact is
    // an honest fence here (no cross-process writers can exist).
    async transact(fn) {
      return fn();
    },
    async close() {
      rows.length = 0;
    },
  };
}

/**
 * W-011 negative fixture: an AuditDb WITHOUT the optional transact
 * fence - the shape a legacy third-party binding presents.
 */
export function createMemoryAuditDbWithoutTransact(): AuditDb {
  const { transact: _dropped, ...db } = createMemoryAuditDb();
  void _dropped;
  return db;
}

/** Minimal binding that produces a memory audit-db for registry tests. */
export function createMemoryAuditDbBinding(id = 'memory'): AuditDbBinding {
  return {
    id,
    description: 'in-memory test binding',
    async open(_options: OpenAuditDbOptions) {
      const db = createMemoryAuditDb();
      return { ...db, binding: id };
    },
  };
}
