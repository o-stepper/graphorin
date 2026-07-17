import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SqliteConnection } from '../connection.js';

/**
 * Single source of truth for the bundled migration SQL files. The runner
 * loads them in numeric order, applies them inside a single transaction,
 * and records the applied version in `schema_migrations`.
 *
 * Bundled migrations live alongside this file (`*.sql`) and are read at
 * package load time. The file name format is mandatory:
 * `NNN-<slug>.sql`, where `NNN` is a zero-padded sequence number.
 *
 * Future packages register additional migrations by appending entries
 * to {@link registerMigration} during their package initialization.
 *
 * @stable
 */
export interface Migration {
  /** Zero-padded sequence number - must be globally unique. */
  readonly version: string;
  /** Human-readable slug, e.g. `'memory'`. */
  readonly name: string;
  /** Raw SQL body (multi-statement). */
  readonly sql: string;
  /** Owning module - surfaced in error messages. */
  readonly owner: string;
  /**
   * W-111: optional data-repair hook. The runner invokes it INSIDE the
   * migration's transaction, immediately BEFORE `sql`, and only when
   * the migration is actually pending. It exists so a migration whose
   * DDL cannot tolerate pre-existing bad data (e.g. a CREATE UNIQUE
   * INDEX over rows that already contain duplicates) can repair that
   * data first WITHOUT editing the SQL file - the file stays
   * byte-identical, so the checksum tamper-guard keeps holding for
   * databases that already applied the version.
   */
  readonly preflight?: (conn: SqliteConnection) => void;
}

const MODULE_PATH = fileURLToPath(import.meta.url);
const MIGRATIONS_DIR = dirname(MODULE_PATH);

const FILE_NAME_PATTERN = /^(\d{3})-([a-z0-9-]+)\.sql$/;

const BUILTIN_OWNERS: Readonly<Record<string, string>> = {
  '001': '@graphorin/memory',
  '002': '@graphorin/workflow',
  '003': '@graphorin/sessions',
  '004': '@graphorin/triggers',
  '005': '@graphorin/server (auth tokens)',
  '006': '@graphorin/security (oauth)',
  '007': '@graphorin/triggers (fire log)',
  '008': '@graphorin/server (idempotency)',
  '009': '@graphorin/memory (consolidator)',
  '010': '@graphorin/memory (conflict-check)',
  '011': '@graphorin/memory (fact-conflicts audit)',
  '012': '@graphorin/memory (conflict-check conflicting ids)',
  '013': '@graphorin/memory (provenance/quarantine)',
  '014': '@graphorin/memory (reflection insights)',
  '015': '@graphorin/memory (fact importance / multi-signal forgetting)',
  '016': '@graphorin/memory (entity graph / one-hop expansion)',
  '017': '@graphorin/memory (induced procedures / workflow induction)',
  '018': '@graphorin/memory (reflection watermark)',
  '019': '@graphorin/memory (DLQ failed-phase)',
  '020': '@graphorin/memory (rule demonstrated-success counter)',
  '021': '@graphorin/memory (run episode/insight counters)',
  '022': '@graphorin/store-sqlite (session sequence uniqueness)',
  '023': '@graphorin/store-sqlite (drop dead facts.hash column)',
  '024': '@graphorin/store-sqlite (durable span persistence)',
  '025': '@graphorin/store-sqlite (fact supersede-chain indexes)',
  '026': '@graphorin/memory (principal/owner dimension)',
  '027': '@graphorin/memory (fact retrieval-access counter)',
  '028': '@graphorin/memory (rules FTS / runbook recall)',
  '029': '@graphorin/store-sqlite (checkpoint session linkage / erasure cascade)',
  '030': '@graphorin/store-sqlite (span end-time retention index)',
  '031': '@graphorin/store-sqlite (drop dead trigger_fire_log table)',
  '032': '@graphorin/store-sqlite (workflow durable-timer wake_at enumeration)',
  '033': '@graphorin/store-sqlite (embedding index-mode column)',
  '034': '@graphorin/channels (pairing requests + paired peers)',
  '035': '@graphorin/memory (session-message security verdict)',
  '036': '@graphorin/memory (recall ledger - distinct-query counter)',
  '037': '@graphorin/store-sqlite (FTS tokenizer trailing-punctuation fix)',
  '038': '@graphorin/server (durable suspended agent runs)',
};

/**
 * W-111: data-repair preflights for bundled migrations, keyed by
 * version (see {@link Migration.preflight}).
 */
const BUILTIN_PREFLIGHTS: Readonly<Record<string, (conn: SqliteConnection) => void>> = {
  // 022 creates UNIQUE(scope_session_id, sequence) over EXISTING rows.
  // A database that actually hit the MAX+1 race 022 was written to fix
  // (two writers appending to one session) already holds duplicate
  // sequence values, so the CREATE UNIQUE INDEX would throw - and
  // store.init() (hence the server and CLI) could never start on
  // exactly the databases that need the fix. Deterministically
  // renumber ONLY the sessions that contain duplicates, preserving
  // relative order via (sequence, created_at, rowid). Rowids and ids
  // are untouched; sessions without duplicates keep their sequence
  // values byte-for-byte.
  '022': (conn) => {
    conn.execMany(`
      UPDATE session_messages
      SET sequence = renumbered.new_sequence
      FROM (
        SELECT rowid AS row_id,
               ROW_NUMBER() OVER (
                 PARTITION BY scope_session_id
                 ORDER BY sequence, created_at, rowid
               ) AS new_sequence
        FROM session_messages
        WHERE scope_session_id IN (
          SELECT scope_session_id
          FROM session_messages
          GROUP BY scope_session_id, sequence
          HAVING COUNT(*) > 1
        )
      ) AS renumbered
      WHERE session_messages.rowid = renumbered.row_id;
    `);
  },
};

const dynamicMigrations: Migration[] = [];

function loadBuiltinMigrations(): Migration[] {
  const entries = readdirSync(MIGRATIONS_DIR, { withFileTypes: true });
  const migrations: Migration[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = FILE_NAME_PATTERN.exec(entry.name);
    if (!match) continue;
    const [, version, name] = match;
    if (version === undefined || name === undefined) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, entry.name), 'utf8');
    const preflight = BUILTIN_PREFLIGHTS[version];
    migrations.push({
      version,
      name,
      sql,
      owner: BUILTIN_OWNERS[version] ?? '@graphorin/store-sqlite',
      ...(preflight !== undefined ? { preflight } : {}),
    });
  }
  return migrations.sort((a, b) => a.version.localeCompare(b.version));
}

let cachedBuiltins: Migration[] | null = null;

/**
 * Returns the full ordered migration list (built-ins + any registered
 * dynamic migrations). Sorted by `version`. Verifies that no two entries
 * share the same version.
 *
 * @stable
 */
export function listMigrations(): readonly Migration[] {
  if (cachedBuiltins === null) {
    cachedBuiltins = loadBuiltinMigrations();
  }
  const all = [...cachedBuiltins, ...dynamicMigrations].sort((a, b) =>
    a.version.localeCompare(b.version),
  );
  const seen = new Set<string>();
  for (const m of all) {
    if (seen.has(m.version)) {
      throw new Error(
        `[graphorin/store-sqlite] duplicate migration version ${m.version} (${m.owner}: ${m.name})`,
      );
    }
    seen.add(m.version);
  }
  return all;
}

/**
 * Register a runtime-supplied migration. Used by downstream packages
 * that want to ship their schema alongside the bundled set without
 * forking this package.
 *
 * @stable
 */
export function registerMigration(migration: Migration): void {
  if (!FILE_NAME_PATTERN.test(`${migration.version}-${migration.name}.sql`)) {
    throw new Error(
      `[graphorin/store-sqlite] invalid migration name: '${migration.version}-${migration.name}.sql' (expected NNN-slug.sql)`,
    );
  }
  for (const m of listMigrations()) {
    if (m.version === migration.version) {
      throw new Error(
        `[graphorin/store-sqlite] migration ${migration.version} already registered (${m.owner})`,
      );
    }
  }
  dynamicMigrations.push(migration);
}

/**
 * Test-only helper. Drops every dynamically-registered migration so a
 * test can rebuild a clean registry without leaking state across cases.
 *
 * @internal
 */
export function _resetDynamicMigrationsForTesting(): void {
  dynamicMigrations.length = 0;
}
