import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import type {
  BetterSqlite3Constructor,
  BetterSqlite3Database,
  BetterSqlite3Statement,
} from './driver-types.js';
import {
  cipherSelectionPragmas,
  type EncryptionConfig,
  loadCipherDriver,
  resolvePassphrase,
} from './encryption/index.js';

// The structural driver types are defined in `./driver-types.ts` to
// break the `connection.ts <-> encryption/index.ts` import cycle;
// re-exported here so existing import paths keep resolving them from
// this module.
export type { BetterSqlite3Constructor, BetterSqlite3Database, BetterSqlite3Statement };

/**
 * The runtime contract every higher-level store interacts with. The
 * concrete adapter is built by {@link openConnection} and wraps either
 * `better-sqlite3` (default) or `better-sqlite3-multiple-ciphers`
 * (encryption-at-rest opt-in).
 *
 * @stable
 */
export interface SqliteConnection {
  /** Path to the underlying database file (`':memory:'` for in-memory). */
  readonly path: string;
  /** Whether the connection is encryption-enabled. */
  readonly encrypted: boolean;
  /** Whether the connection wraps a `:memory:` database. */
  readonly inMemory: boolean;
  pragma(query: string, options?: { simple?: boolean }): unknown;
  exec(query: string): void;
  execMany(sql: string): void;
  run(query: string, params?: ReadonlyArray<unknown>): { changes: number };
  get<T = unknown>(query: string, params?: ReadonlyArray<unknown>): T | undefined;
  all<T = unknown>(query: string, params?: ReadonlyArray<unknown>): T[];
  prepare(query: string): BetterSqlite3Statement;
  transaction<T>(fn: () => T): T;
  close(): void;
  /** Returns the underlying `better-sqlite3` handle. Escape hatch only. */
  raw(): BetterSqlite3Database;
}

/**
 * Mandatory WAL hardening pragmas applied at connection open. Any
 * deviation must be documented in the calling site's TSDoc per the
 * Phase 05 acceptance criteria.
 *
 * @stable
 */
export const WAL_HARDENING_PRAGMAS = [
  'journal_mode = WAL',
  'synchronous = NORMAL',
  'busy_timeout = 5000',
  'mmap_size = 134217728',
  'temp_store = MEMORY',
  'cache_size = -64000',
  'foreign_keys = ON',
] as const;

/**
 * Options for {@link openConnection}.
 *
 * @stable
 */
export interface OpenConnectionOptions {
  readonly path: string;
  /** Optional encryption-at-rest configuration. Default: disabled. */
  readonly encryption?: EncryptionConfig;
  /**
   * If `true`, skip loading the `sqlite-vec` extension. Used by tests
   * that exercise the migration runner without the vector adapter.
   */
  readonly skipSqliteVec?: boolean;
  /**
   * Override the constructor used to open the underlying database.
   * Used by the test suite to inject a stub. When unset the connection
   * lazily loads `better-sqlite3` (or the cipher peer when encryption
   * is enabled) at first call.
   */
  readonly driver?: BetterSqlite3Constructor;
  /**
   * Override the `sqlite-vec` `load(db)` helper. Used by the test
   * suite to verify the loader is invoked without a native build.
   */
  readonly loadVecExtension?: (db: BetterSqlite3Database) => void;
  /**
   * If `true`, do not apply the WAL hardening pragmas. The runner
   * still applies `foreign_keys=ON` and `busy_timeout` so the
   * migration step works against `:memory:` databases. Off by default.
   */
  readonly disableWalHardening?: boolean;
  /**
   * Optional cipher-driver loader override. When `encryption.enabled`
   * is `true` and the operator does not pass `driver`, this loader is
   * consulted instead of the canonical
   * {@link import('./encryption/index.js').loadCipherDriver}. Used by
   * the test suite to simulate a missing cipher peer without
   * uninstalling the package from the workspace.
   *
   * @internal
   */
  readonly cipherLoader?: () => Promise<BetterSqlite3Constructor>;
}

/** @internal */
let DEFAULT_DRIVER_CTOR: BetterSqlite3Constructor | null = null;

/**
 * Lazily resolves the default `better-sqlite3` constructor. The peer
 * is required at runtime when the caller does not supply
 * {@link OpenConnectionOptions.driver}.
 *
 * @internal
 */
async function loadDefaultDriver(): Promise<BetterSqlite3Constructor> {
  if (DEFAULT_DRIVER_CTOR !== null) return DEFAULT_DRIVER_CTOR;
  const mod = (await import('better-sqlite3')) as unknown as {
    default: BetterSqlite3Constructor;
  };
  DEFAULT_DRIVER_CTOR = mod.default;
  return DEFAULT_DRIVER_CTOR;
}

/** @internal */
let DEFAULT_VEC_LOADER: ((db: BetterSqlite3Database) => void) | null = null;

/** @internal */
async function loadDefaultVecLoader(): Promise<(db: BetterSqlite3Database) => void> {
  if (DEFAULT_VEC_LOADER !== null) return DEFAULT_VEC_LOADER;
  try {
    const mod = (await import('sqlite-vec')) as unknown as {
      load: (db: unknown) => void;
    };
    DEFAULT_VEC_LOADER = (db: BetterSqlite3Database) => mod.load(db);
    return DEFAULT_VEC_LOADER;
  } catch (err) {
    throw new SqliteVecMissingError(
      'sqlite-vec peer dependency is required for vector search. Install with `pnpm add sqlite-vec`.',
      { cause: err },
    );
  }
}

/**
 * Test-only helper. Drops cached driver / loader handles so the next
 * `openConnection(...)` call resolves them again.
 *
 * @internal
 */
export function _resetDriverCacheForTesting(): void {
  DEFAULT_DRIVER_CTOR = null;
  DEFAULT_VEC_LOADER = null;
}

/**
 * Opens a connection. Side effects (in this order):
 *   1. Resolve the encryption passphrase if `encryption.enabled === true`.
 *   2. Load the cipher driver or the default `better-sqlite3` peer.
 *   3. Create the parent directory if absent (`recursive: true`).
 *   4. Open the database file.
 *   5. Apply WAL hardening pragmas.
 *   6. Apply the cipher passphrase (`PRAGMA key = ...`).
 *   7. Load `sqlite-vec` (unless `skipSqliteVec` is set).
 *
 * @stable
 */
export async function openConnection(options: OpenConnectionOptions): Promise<SqliteConnection> {
  const {
    path,
    encryption,
    skipSqliteVec = false,
    driver,
    loadVecExtension,
    disableWalHardening = false,
    cipherLoader,
  } = options;

  const inMemory = path === ':memory:';
  const absolutePath = inMemory ? ':memory:' : isAbsolute(path) ? path : resolve(path);

  if (!inMemory) {
    mkdirSync(dirname(absolutePath), { recursive: true });
  }

  const resolvedEncryption: EncryptionConfig = encryption ?? { enabled: false };
  let cipherPassphrase: string | undefined;
  if (resolvedEncryption.enabled) {
    cipherPassphrase = await resolvePassphrase(resolvedEncryption);
  }

  let Ctor: BetterSqlite3Constructor;
  if (driver) {
    Ctor = driver;
  } else if (resolvedEncryption.enabled) {
    const loader = cipherLoader ?? loadCipherDriver;
    Ctor = await loader();
  } else {
    Ctor = await loadDefaultDriver();
  }

  const db = new Ctor(absolutePath);

  if (resolvedEncryption.enabled && cipherPassphrase !== undefined) {
    // CS-7: pin the cipher BEFORE `PRAGMA key` — sqlite3mc defaults to
    // chacha20, so a SQLCipher-v4 database opened with `key` alone
    // reads garbage. The selection pragmas are a no-op on the stub
    // driver and on databases already using the peer default.
    for (const pragma of cipherSelectionPragmas(resolvedEncryption.cipher ?? 'sqlcipher')) {
      db.pragma(pragma);
    }
    // The cipher peer reads the passphrase via `PRAGMA key`. The
    // pragma must run before any other statement. The passphrase is
    // already SQL-literal encoded by `resolvePassphrase`.
    db.pragma(`key = ${cipherPassphrase}`);
  }

  if (!disableWalHardening && !inMemory) {
    for (const pragma of WAL_HARDENING_PRAGMAS) {
      db.pragma(pragma);
    }
  } else {
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
  }

  if (!skipSqliteVec) {
    const loader = loadVecExtension ?? (await loadDefaultVecLoader());
    loader(db);
  }

  const connection: SqliteConnection = {
    path: absolutePath,
    encrypted: resolvedEncryption.enabled,
    inMemory,
    pragma(query, opts) {
      return db.pragma(query, opts);
    },
    exec(query) {
      db.exec(query);
    },
    execMany(sql) {
      db.exec(sql);
    },
    run(query, params = []) {
      const stmt = db.prepare(query);
      const r = stmt.run(...params);
      return { changes: r.changes };
    },
    get<T>(query: string, params: ReadonlyArray<unknown> = []): T | undefined {
      const stmt = db.prepare(query);
      return stmt.get<T>(...params);
    },
    all<T>(query: string, params: ReadonlyArray<unknown> = []): T[] {
      const stmt = db.prepare(query);
      return stmt.all<T>(...params);
    },
    prepare(query) {
      return db.prepare(query);
    },
    transaction<T>(fn: () => T): T {
      const wrapped = db.transaction(fn as (...args: unknown[]) => unknown) as () => T;
      return wrapped();
    },
    close() {
      if (db.open) db.close();
    },
    raw() {
      return db;
    },
  };

  return connection;
}

/**
 * Pragma helper that surfaces the runtime value of a single setting as
 * a typed scalar. Used by the integration tests to verify the WAL
 * hardening defaults landed correctly.
 *
 * @stable
 */
export function readPragma(conn: SqliteConnection, name: string): unknown {
  return conn.pragma(name, { simple: true });
}

/**
 * Returns the byte size of the WAL file, or `0` when the file is
 * absent / empty. Surfaced as `graphorin.storage.wal.size_bytes`.
 *
 * @stable
 */
export function readWalSize(conn: SqliteConnection): number {
  if (conn.inMemory) return 0;
  const result = conn.pragma('wal_checkpoint(PASSIVE)') as
    | ReadonlyArray<{ busy: number; log: number; checkpointed: number }>
    | undefined;
  // The `log` column returns the number of WAL pages — convert to bytes.
  const pages = result?.[0]?.log ?? 0;
  const pageSize = (conn.pragma('page_size', { simple: true }) as number) ?? 4096;
  return pages * pageSize;
}

/**
 * Periodic `wal_checkpoint(RESTART)` runner. Invoked by the worker
 * pool every `intervalMs` to bound WAL growth on long-running servers.
 *
 * @stable
 */
export class WalCheckpointManager {
  #conn: SqliteConnection;
  #intervalMs: number;
  #handle: ReturnType<typeof setInterval> | null = null;

  constructor(conn: SqliteConnection, intervalMs: number) {
    this.#conn = conn;
    this.#intervalMs = intervalMs;
  }

  start(): void {
    if (this.#handle !== null) return;
    if (this.#conn.inMemory) return;
    this.#handle = setInterval(() => {
      try {
        this.#conn.pragma('wal_checkpoint(RESTART)');
      } catch {
        // Best-effort: swallow transient lock failures so the timer keeps running.
      }
    }, this.#intervalMs);
    this.#handle.unref?.();
  }

  stop(): void {
    if (this.#handle !== null) {
      clearInterval(this.#handle);
      this.#handle = null;
    }
  }
}

/** @stable */
export class SqliteVecMissingError extends Error {
  override readonly name = 'SqliteVecMissingError';
}
