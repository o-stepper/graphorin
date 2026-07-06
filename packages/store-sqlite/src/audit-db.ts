import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import type { BetterSqlite3Constructor, BetterSqlite3Database } from './connection.js';
import type { EncryptionConfig } from './encryption/index.js';
import {
  CipherPeerMissingError,
  cipherSelectionPragmas,
  loadCipherDriver,
  resolvePassphrase,
} from './encryption/index.js';

/**
 * Options for {@link openAuditDatabase}. The audit database is **always
 * encrypted** (DEC-124); if the cipher peer is missing the call fails
 * fast with {@link CipherPeerMissingError}.
 *
 * @stable
 */
export interface OpenAuditDatabaseOptions {
  readonly path: string;
  /** Cipher / passphrase resolver - required because audit.db is encrypted. */
  readonly encryption: Extract<EncryptionConfig, { enabled: true }>;
  /** Optional driver override for tests. */
  readonly driver?: BetterSqlite3Constructor;
  /**
   * Optional cipher-driver loader override. When unset the function
   * defers to the canonical {@link loadCipherDriver}. Used by the test
   * suite to simulate a missing cipher peer without uninstalling the
   * package from the workspace.
   *
   * @internal
   */
  readonly cipherLoader?: () => Promise<BetterSqlite3Constructor>;
}

/**
 * Lightweight handle returned by {@link openAuditDatabase}. The audit
 * package (Phase 03) owns the schema; this module only opens the file
 * with the cipher peer and applies WAL hardening so the consumer can
 * focus on appending audit records.
 *
 * @stable
 */
export interface AuditDatabase {
  readonly path: string;
  readonly db: BetterSqlite3Database;
  close(): void;
}

/**
 * Opens the encrypted `audit.db` file.
 *
 * @stable
 */
export async function openAuditDatabase(options: OpenAuditDatabaseOptions): Promise<AuditDatabase> {
  const { path, encryption, driver, cipherLoader } = options;
  if (!encryption.enabled) {
    throw new Error(
      '[graphorin/store-sqlite] openAuditDatabase requires encryption.enabled = true',
    );
  }
  const absolutePath = isAbsolute(path) ? path : resolve(path);
  mkdirSync(dirname(absolutePath), { recursive: true });

  let Ctor: BetterSqlite3Constructor;
  if (driver !== undefined) {
    Ctor = driver;
  } else {
    const loader = cipherLoader ?? loadCipherDriver;
    try {
      Ctor = await loader();
    } catch (err) {
      if (err instanceof CipherPeerMissingError) {
        throw new CipherPeerMissingError(
          `[graphorin/store-sqlite] audit.db (${absolutePath}) requires the cipher peer 'better-sqlite3-multiple-ciphers'. ` +
            'audit.db is mandatory-encrypted by DEC-124 and never silently downgrades.',
          { cause: err },
        );
      }
      throw err;
    }
  }

  const passphrase = await resolvePassphrase(encryption);
  const db = new Ctor(absolutePath);
  // W-110 / CS-7: pin the cipher BEFORE PRAGMA key, exactly like the
  // main-store openConnection - otherwise `config.audit.cipher` was
  // silently ignored and every audit.db came out as sqlite3mc's
  // default. The audit default is 'chacha20' (NOT the main store's
  // 'sqlcipher'): all pre-fix audit files were created without cipher
  // pragmas, i.e. in chacha20 format, so pinning chacha20 stays
  // byte-compatible while 'sqlcipher' would brick every existing file.
  for (const pragma of cipherSelectionPragmas(encryption.cipher ?? 'chacha20')) {
    db.pragma(pragma);
  }
  db.pragma(`key = ${passphrase}`);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  return {
    path: absolutePath,
    db,
    close() {
      if (db.open) db.close();
    },
  };
}
