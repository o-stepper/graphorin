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
 * Apply every pending migration in version order. Each migration runs
 * inside its own transaction so a failure mid-sequence leaves the
 * database in a known-good state. Re-running `runMigrations` on a
 * fully-migrated DB is a no-op.
 *
 * @stable
 */
export function runMigrations(conn: SqliteConnection): readonly AppliedMigration[] {
  ensureSchemaMigrationsTable(conn);
  const applied = readApplied(conn);
  const pending: Migration[] = [];
  for (const m of listMigrations()) {
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
    conn.transaction(() => {
      conn.execMany(m.sql);
      conn.run(
        'INSERT INTO schema_migrations (version, name, applied_at, checksum) VALUES (?, ?, ?, ?)',
        [m.version, m.name, appliedAt, checksum],
      );
    });
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
