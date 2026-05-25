import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  /** Zero-padded sequence number — must be globally unique. */
  readonly version: string;
  /** Human-readable slug, e.g. `'memory'`. */
  readonly name: string;
  /** Raw SQL body (multi-statement). */
  readonly sql: string;
  /** Owning module — surfaced in error messages. */
  readonly owner: string;
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
    migrations.push({
      version,
      name,
      sql,
      owner: BUILTIN_OWNERS[version] ?? '@graphorin/store-sqlite',
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
