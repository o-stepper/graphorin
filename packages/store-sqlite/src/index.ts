/**
 * @graphorin/store-sqlite — default SQLite-backed persistence layer for
 * the Graphorin framework.
 *
 * Bundles:
 * - `MemoryStore`, `CheckpointStore`, `SessionStore`, `TriggerStore`,
 *   `AuthTokenStore`, `OAuthServerStore`, `IdempotencyStore` —
 *   complete implementations of every storage contract from
 *   `@graphorin/core/contracts`.
 * - WAL hardening + WorkerPool-ready connection layer.
 * - Atomic migration runner with a registry every other package can
 *   plug additional migrations into.
 * - Multi-table per-embedder vec0 layout + multilingual FTS5.
 * - Encryption-or-fail-fast hook (cipher peer in Phase 16).
 *
 * @packageDocumentation
 */

import type {
  AuthTokenStore,
  CheckpointStore,
  MemoryStore,
  OAuthServerStore,
  SessionStore,
  TriggerStore,
} from '@graphorin/core/contracts';
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
  type EncryptionCipher,
  type EncryptionConfig,
  loadCipherDriver,
  type PassphraseResolver,
  resolvePassphrase,
} from './encryption/index.js';
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
import { type AppliedMigration, runMigrations } from './migrations/runner.js';
import { SqliteOAuthServerStore } from './oauth-server-store.js';
import { SqliteSessionStore } from './session-store.js';
import { SqliteTriggerStore } from './trigger-store.js';
import { VectorTableManager } from './vector-table-mgr.js';

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.3.0';

/**
 * Library mode — single in-process connection. Server mode — opt-in
 * `WorkerPool` (1 writer + N readers); WAL hardening and the periodic
 * `wal_checkpoint(RESTART)` are mandatory in this mode.
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
  /** Override constructor — test-only escape hatch. */
  readonly driver?: BetterSqlite3Constructor;
  /** Override the `sqlite-vec` loader — test-only escape hatch. */
  readonly loadVecExtension?: (db: unknown) => void;
  /** If `true`, skip the WAL hardening pragmas (only for `:memory:`). */
  readonly disableWalHardening?: boolean;
  /**
   * Optional cipher-driver loader override (test-only seam). See
   * {@link import('./connection.js').OpenConnectionOptions.cipherLoader}.
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
  readonly memory: MemoryStore;
  readonly checkpoints: CheckpointStore;
  readonly sessions: SessionStore;
  readonly triggers: TriggerStore;
  readonly authTokens: AuthTokenStore;
  readonly oauthServers: OAuthServerStore;
  readonly idempotency: IdempotencyStore;
  readonly embeddings: EmbeddingMetaRepository;
  readonly connection: SqliteConnection;
  readonly appliedMigrations: readonly AppliedMigration[];
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
    if ((options.mode ?? 'lib') === 'server') {
      checkpointMgr.start();
    } else if (options.walCheckpointIntervalMs !== undefined) {
      checkpointMgr.start();
    }
    initialized = true;
  };

  const embeddings = new EmbeddingMetaRepository(conn, policy);
  const memoryStore = new SqliteMemoryStore(conn, embeddings);
  const checkpointStore = new SqliteCheckpointStore(conn);
  const sessionStore = new SqliteSessionStore(conn);
  const triggerStore = new SqliteTriggerStore(conn);
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
  type DlqBatchInput,
  type DlqBatchRow,
  EmbedderLockOnFirstError,
  // embedder registry
  type EmbedderPolicy,
  EmbeddingMetaRepository,
  type EmbeddingMetaRow,
  // memory writer extensions
  type EmbeddingPayload,
  type EncryptionCipher,
  type EncryptionConfig,
  type IdempotencyRecord,
  type IdempotencyStore,
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
  type RegisterEmbedderInput,
  readPragma,
  readWalSize,
  registerMigration,
  resolvePassphrase,
  runMigrations,
  SqliteAuthTokenStore,
  SqliteCheckpointStore,
  SqliteConflictStore,
  SqliteConsolidatorStateStore,
  SqliteIdempotencyStore,
  // store impls
  SqliteMemoryStore,
  type SqliteMemoryWriteOptions,
  SqliteOAuthServerStore,
  SqliteSessionStore,
  SqliteTriggerStore,
  slugifyEmbedderId,
  UnknownEmbedderIdError,
  VectorTableManager,
  WAL_HARDENING_PRAGMAS,
  WalCheckpointManager,
};
