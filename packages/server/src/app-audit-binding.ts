/**
 * Default audit-db binding registration for `createServer({...})`.
 *
 * Extracted from `app.ts` so the binding (and its SQLite row mapping)
 * lives next to nothing but itself; the server lifecycle and the CLI
 * both call {@link ensureStoreAuditBinding} before opening the audit
 * chain.
 *
 * @packageDocumentation
 */

import { registerAuditDbBinding } from '@graphorin/security/audit';
import { loadCipherDriver } from '@graphorin/store-sqlite';

/**
 * Pre-built audit-db binding shipped from `@graphorin/store-sqlite`.
 * Registered exactly once per process so {@link openAuditDb} can find
 * a default binding without forcing operators to wire it manually.
 *
 * Exported as {@link ensureStoreAuditBinding} so the CLI (Phase 15
 * `graphorin audit verify | prune | export`) can reach into the same
 * binding without booting the HTTP listener.
 *
 * @stable
 */
let storeAuditBindingRegistered = false;
export function ensureStoreAuditBinding(): void {
  if (storeAuditBindingRegistered) return;
  registerAuditDbBinding(
    {
      id: 'better-sqlite3-multiple-ciphers',
      description: 'Default audit-db binding shipped by @graphorin/store-sqlite.',
      open: async (opts) => {
        const driver = await loadCipherDriver();
        const passphrase = await opts.passphrase.use((value) => value);
        const Db = driver as unknown as new (
          path: string,
        ) => {
          pragma(s: string): unknown;
          prepare(sql: string): {
            run(...args: unknown[]): unknown;
            get(...args: unknown[]): unknown;
            all(...args: unknown[]): unknown;
            iterate(...args: unknown[]): IterableIterator<unknown>;
          };
          exec(sql: string): unknown;
          close(): void;
          open: boolean;
        };
        const db = new Db(opts.path);
        db.pragma(`key = '${passphrase.replace(/'/g, "''")}'`);
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('busy_timeout = 5000');
        db.pragma('foreign_keys = ON');
        db.exec(
          `CREATE TABLE IF NOT EXISTS audit_log (
            seq INTEGER PRIMARY KEY,
            ts INTEGER NOT NULL,
            actor_json TEXT NOT NULL,
            action TEXT NOT NULL,
            target TEXT NOT NULL,
            decision TEXT NOT NULL,
            context_json TEXT,
            metadata_json TEXT,
            prev_hash TEXT NOT NULL,
            hash TEXT NOT NULL UNIQUE
          ) WITHOUT ROWID;`,
        );
        return {
          binding: 'better-sqlite3-multiple-ciphers',
          path: opts.path,
          async insert(entry) {
            db.prepare(
              `INSERT INTO audit_log (
                 seq, ts, actor_json, action, target, decision,
                 context_json, metadata_json, prev_hash, hash
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ).run(
              entry.seq,
              entry.ts,
              JSON.stringify(entry.actor),
              entry.action,
              entry.target,
              entry.decision,
              entry.context !== undefined ? JSON.stringify(entry.context) : null,
              entry.metadata !== undefined ? JSON.stringify(entry.metadata) : null,
              entry.prevHash,
              entry.hash,
            );
            return entry;
          },
          async latest() {
            const row = db.prepare('SELECT * FROM audit_log ORDER BY seq DESC LIMIT 1').get() as
              | undefined
              | {
                  seq: number;
                  ts: number;
                  actor_json: string;
                  action: string;
                  target: string;
                  decision: string;
                  context_json: string | null;
                  metadata_json: string | null;
                  prev_hash: string;
                  hash: string;
                };
            if (row === undefined) return undefined;
            return rowToEntry(row);
          },
          async *iterate(bounds) {
            const lo = bounds?.fromSeq ?? 1;
            const hi = bounds?.toSeq ?? Number.MAX_SAFE_INTEGER;
            const iter = db
              .prepare('SELECT * FROM audit_log WHERE seq BETWEEN ? AND ? ORDER BY seq ASC')
              .iterate(lo, hi);
            for (const row of iter) yield rowToEntry(row as Parameters<typeof rowToEntry>[0]);
          },
          async count() {
            const row = db.prepare('SELECT COUNT(*) AS n FROM audit_log').get() as { n: number };
            return row.n;
          },
          async deleteUpTo(threshold) {
            const before = db
              .prepare('SELECT COUNT(*) AS n FROM audit_log WHERE seq <= ?')
              .get(threshold) as { n: number };
            db.prepare('DELETE FROM audit_log WHERE seq <= ?').run(threshold);
            return before.n;
          },
          async replaceEntry(entry) {
            db.prepare(`UPDATE audit_log SET prev_hash = ?, hash = ? WHERE seq = ?`).run(
              entry.prevHash,
              entry.hash,
              entry.seq,
            );
          },
          // W-011: cross-process fence. Raw BEGIN IMMEDIATE (not
          // better-sqlite3's .transaction() - that helper rejects async
          // functions, while this binding's methods are async-shaped
          // with synchronous bodies; the in-process WRITE_CHAINS
          // serialisation guarantees no foreign statement interleaves
          // inside the transaction). ROLLBACK strictly in finally so an
          // exception can never leave the handle wedged inside an open
          // transaction.
          async transact(fn) {
            db.exec('BEGIN IMMEDIATE');
            let committed = false;
            try {
              const result = await fn();
              db.exec('COMMIT');
              committed = true;
              return result;
            } finally {
              if (!committed) {
                try {
                  db.exec('ROLLBACK');
                } catch {
                  // Already rolled back / connection unusable - nothing to release.
                }
              }
            }
          },
          async close() {
            if (db.open) db.close();
          },
        };
      },
    },
    { setAsDefault: true },
  );
  storeAuditBindingRegistered = true;
}

function rowToEntry(row: {
  seq: number;
  ts: number;
  actor_json: string;
  action: string;
  target: string;
  decision: string;
  context_json: string | null;
  metadata_json: string | null;
  prev_hash: string;
  hash: string;
}) {
  return {
    seq: row.seq,
    ts: row.ts,
    actor: JSON.parse(row.actor_json),
    action: row.action,
    target: row.target,
    decision: row.decision as 'success' | 'denied' | 'error' | 'not-found',
    ...(row.context_json !== null ? { context: JSON.parse(row.context_json) } : {}),
    ...(row.metadata_json !== null ? { metadata: JSON.parse(row.metadata_json) } : {}),
    prevHash: row.prev_hash,
    hash: row.hash,
  };
}
