/**
 * Integrity-check runner for encrypted databases. sqlite3mc ships no
 * `PRAGMA cipher_integrity_check` (the old call returned an
 * empty row-set on every real run, so `ok` was always false); the
 * standard `PRAGMA integrity_check` works through the cipher layer
 * once the connection is keyed, which is exactly the property the
 * CLI / health endpoint needs ("can this DB be read with this key,
 * and is it internally consistent").
 *
 * @packageDocumentation
 */

import type { SqliteConnection } from '@graphorin/store-sqlite/connection';

/**
 * Result of {@link cipherIntegrityCheck}.
 *
 * @stable
 */
export interface CipherIntegrityCheckResult {
  /** `true` when SQLite reported a single `'ok'` row. */
  readonly ok: boolean;
  /** Raw rows returned by `PRAGMA integrity_check`. */
  readonly rows: ReadonlyArray<string>;
  /** Wall-clock duration of the pragma call in milliseconds. */
  readonly durationMs: number;
}

/**
 * Runs `PRAGMA integrity_check` against the provided connection. The
 * connection MUST already be open with the cipher key applied
 * (typically via {@link createEncryptedConnection}) - a wrong key
 * surfaces as an open/read error before the pragma runs.
 *
 * The pragma is read-only so it is safe to run from a triggers daemon
 * cron without taking a write lock.
 *
 * @stable
 */
export function cipherIntegrityCheck(conn: SqliteConnection): CipherIntegrityCheckResult {
  const started = performance.now();
  const raw = conn.pragma('integrity_check');
  const durationMs = performance.now() - started;
  const rows = normalizeRows(raw);
  const ok = rows.length === 1 && rows[0] === 'ok';
  return Object.freeze({ ok, rows: Object.freeze(rows), durationMs });
}

function normalizeRows(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const row of raw as ReadonlyArray<unknown>) {
    if (typeof row === 'string') {
      out.push(row);
    } else if (row !== null && typeof row === 'object') {
      const obj = row as Record<string, unknown>;
      const value = obj.cipher_integrity_check ?? obj.integrity_check ?? Object.values(obj)[0];
      if (typeof value === 'string') out.push(value);
    }
  }
  return out;
}
