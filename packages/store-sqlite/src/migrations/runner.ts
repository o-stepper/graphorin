import type { SqliteConnection } from '../connection.js';
import { listMigrations, type Migration } from './registry.js';

/**
 * Result row of the `schema_migrations` bookkeeping table - one row per
 * applied migration.
 *
 * @stable
 */
export interface AppliedMigration {
  readonly version: string;
  readonly name: string;
  readonly appliedAt: number;
  readonly checksum: string;
}

/**
 * Tuning knobs for {@link runMigrations}. Only `upTo` exists so
 * far and it is test-only.
 *
 * @internal
 */
export interface RunMigrationsOptions {
  /**
   * Stop after this version (inclusive) - later migrations stay
   * pending. Test-only: lets a suite build a database frozen at a
   * historical schema and then exercise the upgrade path across a
   * specific migration. Not for production use; a partially-migrated
   * database is not a supported runtime state.
   *
   * @internal
   */
  readonly upTo?: string;
}

/**
 * Apply every pending migration in version order. Each migration runs
 * inside its own transaction so a failure mid-sequence leaves the
 * database in a known-good state. Re-running `runMigrations` on a
 * fully-migrated DB is a no-op.
 *
 * @stable
 */
export function runMigrations(
  conn: SqliteConnection,
  options?: RunMigrationsOptions,
): readonly AppliedMigration[] {
  ensureSchemaMigrationsTable(conn);
  const applied = readApplied(conn);
  const pending: Migration[] = [];
  for (const m of listMigrations()) {
    if (options?.upTo !== undefined && m.version.localeCompare(options.upTo) > 0) continue;
    const prior = applied.get(m.version);
    if (prior === undefined) {
      pending.push(m);
      continue;
    }
    const checksum = computeChecksum(m.sql);
    if (prior.checksum !== checksum) {
      throw new Error(
        `[graphorin/store-sqlite] migration ${m.version} (${m.name}) was modified after being applied; refusing to run.`,
      );
    }
  }

  const newlyApplied: AppliedMigration[] = [];
  for (const m of pending) {
    const checksum = computeChecksum(m.sql);
    const appliedAt = Date.now();
    let skipped = false;
    conn.transaction(() => {
      // W-068 TOCTOU fence: the applied-set above was read OUTSIDE any
      // transaction, so a second process racing this one may have
      // applied the migration in between. The IMMEDIATE transaction
      // (conn.transaction) holds the write lock, so re-checking here is
      // authoritative: the loser of the race turns into a no-op instead
      // of crashing on a non-idempotent statement ("duplicate column
      // name" from an ALTER TABLE).
      const already = conn.get<{ version: string }>(
        'SELECT version FROM schema_migrations WHERE version = ?',
        [m.version],
      );
      if (already !== undefined) {
        skipped = true;
        return;
      }
      // W-111: data-repair preflight - same transaction, before the
      // SQL, and only on the pending path (an already-applied version
      // returned above, so preflights never touch settled databases).
      m.preflight?.(conn);
      conn.execMany(m.sql);
      conn.run(
        'INSERT INTO schema_migrations (version, name, applied_at, checksum) VALUES (?, ?, ?, ?)',
        [m.version, m.name, appliedAt, checksum],
      );
    });
    if (skipped) continue;
    newlyApplied.push({
      version: m.version,
      name: m.name,
      appliedAt,
      checksum,
    });
  }

  return newlyApplied;
}

/**
 * The migrations bundled with this build that are NOT recorded as
 * applied in the supplied database. Read-only: when the
 * `schema_migrations` table does not exist yet (a database this code
 * never touched), every bundled migration is pending and the foreign
 * file is NOT marked by creating the table.
 *
 * @stable
 */
export function pendingMigrations(conn: SqliteConnection): readonly Migration[] {
  const hasTable = conn.get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
  );
  if (hasTable === undefined) return listMigrations();
  const applied = readApplied(conn);
  return listMigrations().filter((m) => !applied.has(m.version));
}

/**
 * Snapshot of every migration ever applied to this database.
 *
 * @stable
 */
export function listAppliedMigrations(conn: SqliteConnection): readonly AppliedMigration[] {
  ensureSchemaMigrationsTable(conn);
  const rows = conn.all<{
    version: string;
    name: string;
    applied_at: number;
    checksum: string;
  }>('SELECT version, name, applied_at, checksum FROM schema_migrations ORDER BY version');
  return rows.map((row) => ({
    version: row.version,
    name: row.name,
    appliedAt: row.applied_at,
    checksum: row.checksum,
  }));
}

function ensureSchemaMigrationsTable(conn: SqliteConnection): void {
  conn.execMany(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at INTEGER NOT NULL,
      checksum   TEXT NOT NULL
    );
  `);
}

function readApplied(conn: SqliteConnection): Map<string, AppliedMigration> {
  const rows = conn.all<{
    version: string;
    name: string;
    applied_at: number;
    checksum: string;
  }>('SELECT version, name, applied_at, checksum FROM schema_migrations');
  const map = new Map<string, AppliedMigration>();
  for (const row of rows) {
    map.set(row.version, {
      version: row.version,
      name: row.name,
      appliedAt: row.applied_at,
      checksum: row.checksum,
    });
  }
  return map;
}

function computeChecksum(sql: string): string {
  // Cheap, deterministic checksum - FNV-1a 32-bit. The runner only
  // uses it to detect after-the-fact edits to a migration that was
  // already applied. Cryptographic strength is unnecessary here.
  let hash = 0x811c9dc5;
  for (let i = 0; i < sql.length; i++) {
    hash ^= sql.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
