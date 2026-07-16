/**
 * @graphorin/store-sqlite - default SQLite-backed persistence layer for
 * the Graphorin framework.
 *
 * Bundles:
 * - `MemoryStore`, `CheckpointStore`, `SessionStore`, `TriggerStore`,
 *   `AuthTokenStore`, `OAuthServerStore`, `IdempotencyStore` -
 *   complete implementations of every storage contract from
 *   `@graphorin/core/contracts`.
 * - Single-connection layer with WAL + busy-timeout hardening applied
 *   at open.
 * - Atomic migration runner with a registry every other package can
 *   plug additional migrations into.
 * - Multi-table per-embedder vec0 layout + multilingual FTS5.
 * - Encryption-or-fail-fast hook (cipher peer in Phase 16).
 *
 * @packageDocumentation
 */

import type {
  AuthTokenStore,
  CheckpointStoreExt,
  MemoryStoreExt,
  OAuthServerStore,
  PairingStore,
  SessionStoreExt,
  TriggerStore,
} from '@graphorin/core/contracts';
/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };
import {
  type AuditDatabase,
  type OpenAuditDatabaseOptions,
  openAuditDatabase,
} from './audit-db.js';
import { SqliteAuthTokenStore } from './auth-token-store.js';
import { SqliteCheckpointStore } from './checkpoint-store.js';
import {
  type ConflictAuditInput,
  type ConflictAuditRow,
  type ConflictPipelineDecision,
  type ConflictPipelineStage,
  type PendingConflictInput,
  type PendingConflictRow,
  SqliteConflictStore,
} from './conflict-store.js';
import {
  type BetterSqlite3Constructor,
  openConnection,
  readPragma,
  readWalSize,
  SqliteBusyError,
  type SqliteConnection,
  type SqliteVecMissingError,
  WAL_HARDENING_PRAGMAS,
  WalCheckpointManager,
} from './connection.js';
import {
  type ConsolidatorRunFinish,
  type ConsolidatorRunInput,
  type ConsolidatorStatePatch,
  type ConsolidatorStateRow,
  type DlqBatchInput,
  type DlqBatchRow,
  SqliteConsolidatorStateStore,
} from './consolidator-store.js';
import {
  createMigrationBatcher,
  dropRetiredVectorTables,
  EmbedderMigrationStateRepository,
  type EmbedderMigrationStateRow,
} from './embedder-migration-support.js';
import {
  EmbedderLockOnFirstError,
  type EmbedderPolicy,
  EmbeddingMetaRepository,
  type EmbeddingMetaRow,
  type RegisterEmbedderInput,
  slugifyEmbedderId,
  UnknownEmbedderIdError,
} from './embedding-meta-repo.js';
import {
  CipherPeerMissingError,
  cipherSelectionPragmas,
  type EncryptionCipher,
  type EncryptionConfig,
  loadCipherDriver,
  type PassphraseResolver,
  resolvePassphrase,
} from './encryption/index.js';
import {
  checkFtsIntegrity,
  type FtsIntegrityReport,
  formatFtsIntegrityWarning,
  listCheckedFtsTables,
} from './fts-integrity.js';
import {
  type IdempotencyRecord,
  type IdempotencyStore,
  SqliteIdempotencyStore,
} from './idempotency-store.js';
import {
  type EmbeddingPayload,
  SqliteMemoryStore,
  type SqliteMemoryWriteOptions,
} from './memory-store.js';
import { listMigrations, type Migration, registerMigration } from './migrations/registry.js';
import { type AppliedMigration, pendingMigrations, runMigrations } from './migrations/runner.js';
import { SqliteOAuthServerStore } from './oauth-server-store.js';
import { SqlitePairingStore } from './pairing-store.js';
import {
  SESSION_SCOPED_PURGES,
  SESSION_TABLE_EXEMPTIONS,
  type SessionScopedPurge,
  SqliteSessionStore,
} from './session-store.js';
import {
  createSqliteSpanExporter,
  deleteSpansForSession,
  pruneSpans,
  SPAN_SESSION_ATTRIBUTE,
  traceSourceForSession,
} from './span-store.js';
import { SqliteTriggerStore } from './trigger-store.js';
import { VectorTableManager } from './vector-table-mgr.js';

export const VERSION: string = pkg.version;

/**
 * Both modes run on a single in-process connection with the mandatory
 * WAL-hardening pragmas (WAL journal mode, busy-timeout, etc.).
 * `'server'` additionally starts the periodic `wal_checkpoint(RESTART)`
 * manager automatically to bound WAL growth on long-running daemons;
 * `'lib'` starts it only when `walCheckpointIntervalMs` is set.
 *
 * @stable
 */
export type SqliteStoreMode = 'lib' | 'server';

/**
 * Options passed to {@link createSqliteStore}.
 *
 * @stable
 */
export interface CreateSqliteStoreOptions {
  /** SQLite path. Pass `':memory:'` for a transient in-memory database. */
  readonly path: string;
  /** Default `'lib'`. */
  readonly mode?: SqliteStoreMode;
  /** Default `'lock-on-first'` (DEC-116). */
  readonly embedderPolicy?: EmbedderPolicy;
  /** Default `{ enabled: false }`. */
  readonly encryption?: EncryptionConfig;
  /**
   * Periodic checkpoint cadence. Default `300_000` (5 min) in server
   * mode; off in library mode unless explicitly set.
   */
  readonly walCheckpointIntervalMs?: number;
  /**
   * If `true`, do not load the `sqlite-vec` peer at open time. Useful
   * for tests that exercise migrations without the native build.
   */
  readonly skipSqliteVec?: boolean;
  /**
   * Wave-D D5: policy when the `sqlite-vec` peer is missing/broken.
   * `'fail'` (default) throws {@link SqliteVecMissingError};
   * `'linear-fallback'` serves vectors from plain sidecar tables with
   * an in-process batched cosine scan. See
   * `OpenConnectionOptions.onMissingSqliteVec`.
   */
  readonly onMissingSqliteVec?: 'fail' | 'linear-fallback';
  /** Override constructor - test-only escape hatch. */
  readonly driver?: BetterSqlite3Constructor;
  /** Override the `sqlite-vec` loader - test-only escape hatch. */
  readonly loadVecExtension?: (db: unknown) => void;
  /** If `true`, skip the WAL hardening pragmas (only for `:memory:`). */
  readonly disableWalHardening?: boolean;
  /**
   * W-067: busy-handler wait for a contended write lock before the
   * operation fails with `SqliteBusyError`. Default `5000`.
   */
  readonly busyTimeoutMs?: number;
  /**
   * Sink for non-fatal startup warnings - currently the CS-10 FTS↔rowid
   * integrity check. Defaults to `console.warn`.
   */
  readonly warn?: (message: string) => void;
  /**
   * If `true`, skip the open-time FTS integrity check (CS-10). The check is a
   * cheap orphan-row scan; disable it only for very large stores where a
   * per-open scan is undesirable.
   */
  readonly skipFtsIntegrityCheck?: boolean;
  /**
   * Optional cipher-driver loader override (test-only seam). See
   * `OpenConnectionOptions.cipherLoader`.
   *
   * @internal
   */
  readonly cipherLoader?: () => Promise<BetterSqlite3Constructor>;
}

/**
 * Composite handle returned by {@link createSqliteStore}.
 *
 * @stable
 */
export interface GraphorinSqliteStore {
  readonly memory: MemoryStoreExt;
  readonly checkpoints: CheckpointStoreExt;
  readonly sessions: SessionStoreExt;
  readonly triggers: TriggerStore;
  readonly pairing: PairingStore;
  readonly authTokens: AuthTokenStore;
  readonly oauthServers: OAuthServerStore;
  readonly idempotency: IdempotencyStore;
  readonly embeddings: EmbeddingMetaRepository;
  readonly connection: SqliteConnection;
  readonly appliedMigrations: readonly AppliedMigration[];
  /**
   * Wave-D D5 (MST-12): store-side embedder-migration support - the
   * persisted resumable cursor over `migration_state`, the `nextBatch`
   * pager the `@graphorin/memory` runner consumes (structural match),
   * and the retired-vec-table space reclaim.
   */
  readonly embedderMigration: {
    readonly state: EmbedderMigrationStateRepository;
    readonly nextBatch: ReturnType<typeof createMigrationBatcher>;
    dropRetiredVectorTables(): { readonly dropped: ReadonlyArray<string> };
  };
  /** Initialize the store: run migrations + start checkpoint manager. */
  init(): Promise<void>;
  /** Close the connection + stop the checkpoint manager. Idempotent. */
  close(): Promise<void>;
}

/**
 * Open a SQLite-backed Graphorin store. The returned object exposes
 * every contract implementation; call `init()` once before first use.
 *
 * @stable
 */
export async function createSqliteStore(
  options: CreateSqliteStoreOptions,
): Promise<GraphorinSqliteStore> {
  const conn = await openConnection({
    path: options.path,
    ...(options.encryption !== undefined ? { encryption: options.encryption } : {}),
    ...(options.skipSqliteVec !== undefined ? { skipSqliteVec: options.skipSqliteVec } : {}),
    ...(options.onMissingSqliteVec !== undefined
      ? { onMissingSqliteVec: options.onMissingSqliteVec }
      : {}),
    ...(options.driver !== undefined ? { driver: options.driver } : {}),
    ...(options.loadVecExtension !== undefined
      ? {
          loadVecExtension: options.loadVecExtension as (
            db: import('./connection.js').BetterSqlite3Database,
          ) => void,
        }
      : {}),
    ...(options.disableWalHardening !== undefined
      ? { disableWalHardening: options.disableWalHardening }
      : {}),
    ...(options.cipherLoader !== undefined ? { cipherLoader: options.cipherLoader } : {}),
    ...(options.busyTimeoutMs !== undefined ? { busyTimeoutMs: options.busyTimeoutMs } : {}),
  });

  let initialized = false;
  let applied: readonly AppliedMigration[] = [];
  const checkpointMgr = new WalCheckpointManager(
    conn,
    options.walCheckpointIntervalMs ?? 5 * 60 * 1000,
  );

  const policy: EmbedderPolicy = options.embedderPolicy ?? 'lock-on-first';

  const initOnce = async (): Promise<void> => {
    if (initialized) return;
    applied = runMigrations(conn);
    // CS-10: surface FTS↔rowid drift loudly at open. The indexes key on the
    // base row's implicit rowid, which a hand-run VACUUM could renumber and
    // silently corrupt; Graphorin never VACUUMs, so this is a guard, not a
    // hot path. Non-fatal - a warning, never a throw.
    if (options.skipFtsIntegrityCheck !== true) {
      const warning = formatFtsIntegrityWarning(checkFtsIntegrity(conn));
      if (warning !== null) (options.warn ?? console.warn)(warning);
    }
    if ((options.mode ?? 'lib') === 'server') {
      checkpointMgr.start();
    } else if (options.walCheckpointIntervalMs !== undefined) {
      checkpointMgr.start();
    }
    initialized = true;
  };

  const embeddings = new EmbeddingMetaRepository(conn, policy);
  const memoryStore = new SqliteMemoryStore(conn, embeddings);
  // Wave-D D5: the migration surface reuses the memory store's table
  // manager so drops stay visible to its purge paths.
  const embedderMigration = {
    state: new EmbedderMigrationStateRepository(conn),
    nextBatch: createMigrationBatcher(conn, embeddings, memoryStore.vectorTableManager()),
    dropRetiredVectorTables: () =>
      dropRetiredVectorTables(conn, embeddings, memoryStore.vectorTableManager()),
  };
  const checkpointStore = new SqliteCheckpointStore(conn);
  const sessionStore = new SqliteSessionStore(conn);
  const triggerStore = new SqliteTriggerStore(conn);
  const pairingStore = new SqlitePairingStore(conn);
  const authTokenStore = new SqliteAuthTokenStore(conn);
  const oauthServerStore = new SqliteOAuthServerStore(conn);
  const idempotencyStore = new SqliteIdempotencyStore(conn);

  return {
    get memory() {
      return memoryStore;
    },
    get checkpoints() {
      return checkpointStore;
    },
    get sessions() {
      return sessionStore;
    },
    get triggers() {
      return triggerStore;
    },
    get pairing() {
      return pairingStore;
    },
    get authTokens() {
      return authTokenStore;
    },
    get oauthServers() {
      return oauthServerStore;
    },
    get idempotency() {
      return idempotencyStore;
    },
    get embeddings() {
      return embeddings;
    },
    get embedderMigration() {
      return embedderMigration;
    },
    get connection() {
      return conn;
    },
    get appliedMigrations() {
      return applied;
    },
    init: initOnce,
    async close() {
      checkpointMgr.stop();
      await memoryStore.close();
      conn.close();
    },
  };
}

export { SqliteNativeBindingError } from './native-binding-error.js';
export type { BetterSqlite3Constructor, SqliteConnection, SqliteVecMissingError };
export {
  // migrations
  type AppliedMigration,
  // audit db
  type AuditDatabase,
  // encryption
  CipherPeerMissingError,
  // conflict store (Phase 10b)
  type ConflictAuditInput,
  type ConflictAuditRow,
  type ConflictPipelineDecision,
  type ConflictPipelineStage,
  // consolidator state store (Phase 10c)
  type ConsolidatorRunFinish,
  type ConsolidatorRunInput,
  type ConsolidatorStatePatch,
  type ConsolidatorStateRow,
  // FTS integrity (CS-10)
  checkFtsIntegrity,
  cipherSelectionPragmas,
  // span persistence (RP-17)
  createSqliteSpanExporter,
  type DlqBatchInput,
  type DlqBatchRow,
  deleteSpansForSession,
  EmbedderLockOnFirstError,
  // wave-D D5: embedder-migration support
  EmbedderMigrationStateRepository,
  type EmbedderMigrationStateRow,
  // embedder registry
  type EmbedderPolicy,
  EmbeddingMetaRepository,
  type EmbeddingMetaRow,
  // memory writer extensions
  type EmbeddingPayload,
  type EncryptionCipher,
  type EncryptionConfig,
  type FtsIntegrityReport,
  formatFtsIntegrityWarning,
  type IdempotencyRecord,
  type IdempotencyStore,
  listCheckedFtsTables,
  listMigrations,
  loadCipherDriver,
  type Migration,
  type OpenAuditDatabaseOptions,
  openAuditDatabase,
  // connection
  openConnection,
  type PassphraseResolver,
  type PendingConflictInput,
  type PendingConflictRow,
  pendingMigrations,
  pruneSpans,
  type RegisterEmbedderInput,
  readPragma,
  readWalSize,
  registerMigration,
  resolvePassphrase,
  runMigrations,
  SESSION_SCOPED_PURGES,
  SESSION_TABLE_EXEMPTIONS,
  type SessionScopedPurge,
  SPAN_SESSION_ATTRIBUTE,
  SqliteAuthTokenStore,
  SqliteBusyError,
  SqliteCheckpointStore,
  SqliteConflictStore,
  SqliteConsolidatorStateStore,
  SqliteIdempotencyStore,
  // store impls
  SqliteMemoryStore,
  type SqliteMemoryWriteOptions,
  SqliteOAuthServerStore,
  SqlitePairingStore,
  SqliteSessionStore,
  SqliteTriggerStore,
  slugifyEmbedderId,
  traceSourceForSession,
  UnknownEmbedderIdError,
  VectorTableManager,
  WAL_HARDENING_PRAGMAS,
  WalCheckpointManager,
};
