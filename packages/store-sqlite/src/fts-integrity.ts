/**
 * FTS5 ↔ base-table rowid integrity (CS-10).
 *
 * The full-text indexes (`facts_fts`, `episodes_fts`, `session_messages_fts`,
 * `insights_fts`) are keyed to their base tables by the base row's **implicit
 * rowid** - FTS rows are written with `rowid = (SELECT rowid FROM <base> WHERE
 * id = ?)` and searches join `base.rowid = fts.rowid`. SQLite documents that
 * `VACUUM` may renumber implicit rowids, which would silently re-point every
 * FTS hit at a different record.
 *
 * Graphorin never issues `VACUUM`, and the encrypted-export path copies the
 * database file byte-for-byte (preserving rowids) before an in-place rekey, so
 * the hazard is latent - but a human running `VACUUM <db>` by hand would
 * corrupt search. This module is the loud guard the audit asked for: a cheap
 * orphan-row count surfaced at open time (and reusable by `graphorin doctor`).
 *
 * NOTE: never run `VACUUM` on a Graphorin database. Use the export / rekey
 * maintenance path, which preserves rowids.
 *
 * @packageDocumentation
 */

import type { SqliteConnection } from './connection.js';

/** The FTS tables and the base tables they index, by rowid. */
const FTS_PAIRS: ReadonlyArray<readonly [fts: string, base: string]> = [
  ['facts_fts', 'facts'],
  ['episodes_fts', 'episodes'],
  ['session_messages_fts', 'session_messages'],
  ['insights_fts', 'insights'],
];

/** One FTS table's integrity finding. */
export interface FtsIntegrityReport {
  /** The FTS table inspected. */
  readonly table: string;
  /** FTS rows whose `rowid` matches no row in the base table. */
  readonly orphanRows: number;
}

function tableExists(conn: SqliteConnection, name: string): boolean {
  return (
    conn.get<{ n: number }>('SELECT COUNT(*) AS n FROM sqlite_master WHERE name = ?', [name])?.n !==
    0
  );
}

/**
 * Count orphaned FTS rows (rowids with no matching base row) for every FTS
 * table that exists. An empty array means every FTS index is consistent with
 * its base table. A non-empty result is a sign of rowid drift - most likely a
 * hand-run `VACUUM` - and means search may return the wrong records.
 *
 * Tables absent from the schema (e.g. before their migration has run) are
 * skipped rather than reported.
 *
 * @stable
 */
export function checkFtsIntegrity(conn: SqliteConnection): FtsIntegrityReport[] {
  const reports: FtsIntegrityReport[] = [];
  for (const [fts, base] of FTS_PAIRS) {
    if (!tableExists(conn, fts) || !tableExists(conn, base)) continue;
    const orphanRows =
      conn.get<{ n: number }>(
        `SELECT COUNT(*) AS n FROM ${fts} WHERE rowid NOT IN (SELECT rowid FROM ${base})`,
      )?.n ?? 0;
    if (orphanRows > 0) reports.push({ table: fts, orphanRows });
  }
  return reports;
}

/**
 * Format an {@link checkFtsIntegrity} result as a single warning line, or
 * `null` when the indexes are consistent. Used at store-open time.
 */
export function formatFtsIntegrityWarning(
  reports: ReadonlyArray<FtsIntegrityReport>,
): string | null {
  if (reports.length === 0) return null;
  const detail = reports.map((r) => `${r.table}: ${r.orphanRows} orphan row(s)`).join('; ');
  return (
    `[graphorin/store-sqlite] FTS index integrity check found drift (${detail}). ` +
    'This usually means VACUUM was run on the database - never VACUUM a Graphorin ' +
    'store; use the export/rekey maintenance path, which preserves rowids. ' +
    'Rebuild the affected FTS index to restore correct search results.'
  );
}
