/**
 * `PRAGMA cipher_integrity_check` runner. Surfaces the per-page result
 * list as a structured value so the CLI / health endpoint can report
 * the first few failures without dumping the full SQLite output.
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
  /** Raw rows returned by `PRAGMA cipher_integrity_check`. */
  readonly rows: ReadonlyArray<string>;
  /** Wall-clock duration of the pragma call in milliseconds. */
  readonly durationMs: number;
}

/**
 * Runs `PRAGMA cipher_integrity_check` against the provided
 * connection. The connection MUST already be open with the cipher key
 * applied (typically via {@link createEncryptedConnection}).
 *
 * The pragma is read-only so it is safe to run from a triggers daemon
 * cron without taking a write lock.
 *
 * @stable
 */
export function cipherIntegrityCheck(conn: SqliteConnection): CipherIntegrityCheckResult {
  const started = performance.now();
  const raw = conn.pragma('cipher_integrity_check');
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
