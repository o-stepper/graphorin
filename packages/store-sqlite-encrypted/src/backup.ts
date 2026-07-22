/**
 * `backupEncryptedDatabase` - consistent file-level backup of an
 * encrypted SQLite database. Backs `graphorin storage backup` when the
 * store is encrypted.
 *
 * Why not the driver's page-level `backup()` API (the plaintext
 * path)? better-sqlite3's backup worker cannot key either side of the
 * copy, so sqlite3mc refuses the transfer ("backup is not supported
 * with incompatible source and target databases") - and it ships no
 * `sqlcipher_export` equivalent either (real-peer verified, see
 * `encrypt.ts`). The correct encrypted backup is a byte copy of the
 * main file taken while provably no other holder exists:
 *
 *  1. open keyed (verifies the passphrase, recovers any crash WAL),
 *     `wal_checkpoint(TRUNCATE)` so the main file holds every commit,
 *     close (the last close removes the sidecars);
 *  2. prove exclusivity: the sidecars must be gone, and a keyed
 *     journal-mode probe must win the cross-process lock;
 *  3. byte-copy, then re-stat the source - any concurrent mutation
 *     fails the backup rather than shipping a torn copy;
 *  4. open the COPY with the key and run `cipher_integrity_check`.
 *
 * The copy is encrypted with the same key as the source (identical
 * bytes), so the restore runbook is a plain file copy back.
 *
 * @packageDocumentation
 */

import { copyFileSync, existsSync, statSync, unlinkSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import { DEFAULT_CIPHER, type EncryptionCipher } from './cipher-config.js';
import { loadCipherPeer } from './cipher-peer.js';
import { createEncryptedConnection } from './connection.js';
import { EncryptSwapLiveWriterError } from './encrypt.js';
import { cipherIntegrityCheck } from './integrity-check.js';

/**
 * Thrown when {@link backupEncryptedDatabase} detects another live
 * holder of the source database (or a mutation racing the copy).
 * Extends {@link EncryptSwapLiveWriterError} so existing catch sites
 * for the live-writer guard keep working.
 *
 * @stable
 */
export class EncryptedBackupLiveWriterError extends EncryptSwapLiveWriterError {
  constructor(sourcePath: string, cause?: unknown) {
    super(sourcePath, cause);
    this.name = 'EncryptedBackupLiveWriterError';
    this.message =
      `[graphorin/store-sqlite-encrypted] ${sourcePath} appears to be open by another process; ` +
      'an encrypted backup is a consistent byte copy and requires a stopped server. Stop every ' +
      'writer, then retry `graphorin storage backup`.';
  }

  /** Sidecar layer of the guard (mirrors the swap check). */
  static backupForSidecars(
    sourcePath: string,
    present: ReadonlyArray<string>,
  ): EncryptedBackupLiveWriterError {
    const err = new EncryptedBackupLiveWriterError(sourcePath);
    err.message =
      `[graphorin/store-sqlite-encrypted] WAL sidecar file(s) present next to ${sourcePath} ` +
      `(${present.join(', ')}): the database is open by another connection right now, so an ` +
      'encrypted backup cannot take a consistent byte copy. Stop every writer (including the ' +
      'server) and retry.';
    return err;
  }

  /** The source mutated between the pre-copy and post-copy stats. */
  static forConcurrentMutation(sourcePath: string): EncryptedBackupLiveWriterError {
    const err = new EncryptedBackupLiveWriterError(sourcePath);
    err.message =
      `[graphorin/store-sqlite-encrypted] ${sourcePath} changed while the backup copy was in ` +
      'flight - a writer is active. The torn copy was deleted; stop every writer and retry.';
    return err;
  }
}

/**
 * Options for {@link backupEncryptedDatabase}.
 *
 * @stable
 */
export interface BackupEncryptedDatabaseOptions {
  /** Path to the encrypted source DB. */
  readonly sourcePath: string;
  /** Destination path for the backup copy (overwritten if present). */
  readonly destPath: string;
  /** Passphrase the DB is encrypted with. */
  readonly passphrase: string | Buffer;
  /** Cipher selection. Default `'sqlcipher'`. */
  readonly cipher?: EncryptionCipher;
}

/**
 * Result of a successful {@link backupEncryptedDatabase} run.
 *
 * @stable
 */
export interface BackupEncryptedDatabaseResult {
  readonly sourcePath: string;
  readonly destPath: string;
  readonly cipher: EncryptionCipher;
  readonly integrityCheck: { readonly ok: boolean; readonly rows: ReadonlyArray<string> };
}

/**
 * Takes a consistent, still-encrypted backup copy of an encrypted
 * database. Requires a stopped server: throws
 * {@link EncryptedBackupLiveWriterError} when another holder is
 * detected at any layer of the guard. Also throws if the file is
 * missing, the cipher peer cannot be loaded, the passphrase is wrong
 * (`SQLITE_NOTADB` on the first read), or the post-copy integrity
 * check fails.
 *
 * @stable
 */
export async function backupEncryptedDatabase(
  options: BackupEncryptedDatabaseOptions,
): Promise<BackupEncryptedDatabaseResult> {
  const sourcePath = absolute(options.sourcePath);
  const destPath = absolute(options.destPath);
  const cipher = options.cipher ?? DEFAULT_CIPHER;

  if (!existsSync(sourcePath)) {
    throw new Error(`[graphorin/store-sqlite-encrypted] DB not found: ${sourcePath}`);
  }
  if (sourcePath === destPath) {
    throw new Error(
      '[graphorin/store-sqlite-encrypted] backup destination must differ from the source path.',
    );
  }

  await loadCipherPeer();

  // 1. Keyed open: verify the passphrase, recover + fold any WAL into
  //    the main file, and let the close remove the sidecars.
  const conn = await createEncryptedConnection({
    path: sourcePath,
    skipSqliteVec: true,
    disableWalHardening: true,
    encryption: {
      enabled: true,
      cipher,
      passphraseResolver: async () => options.passphrase,
    },
  });
  try {
    // Sanity-read forces the cipher peer to verify the key.
    conn.pragma('user_version');
    const rows = conn.pragma('wal_checkpoint(TRUNCATE)') as ReadonlyArray<{ busy?: number }>;
    if (rows.some((r) => (r.busy ?? 0) !== 0)) {
      throw new EncryptedBackupLiveWriterError(sourcePath);
    }
  } catch (err) {
    if (conn.raw().open) conn.close();
    if (err instanceof EncryptedBackupLiveWriterError) throw err;
    throw new Error(`[graphorin/store-sqlite-encrypted] backup failed: ${(err as Error).message}`, {
      cause: err,
    });
  } finally {
    if (conn.raw().open) conn.close();
  }

  // 2a. Sidecar layer: after our own clean close, surviving sidecars
  //     mean another connection is holding the database open.
  const present = ['-wal', '-shm'].map((s) => `${sourcePath}${s}`).filter((p) => existsSync(p));
  if (present.length > 0) {
    throw EncryptedBackupLiveWriterError.backupForSidecars(sourcePath, present);
  }

  // 2b. Cross-process lock probe (keyed twin of the swap guard): only
  //     an actual 'delete' result proves exclusive access.
  const probe = await createEncryptedConnection({
    path: sourcePath,
    skipSqliteVec: true,
    disableWalHardening: true,
    encryption: {
      enabled: true,
      cipher,
      passphraseResolver: async () => options.passphrase,
    },
  });
  let switched = false;
  try {
    let mode: unknown;
    try {
      const res = probe.pragma('journal_mode = DELETE') as ReadonlyArray<{
        journal_mode?: string;
      }>;
      mode = res[0]?.journal_mode;
      switched = true;
    } catch (err) {
      if (isBusyError(err)) throw new EncryptedBackupLiveWriterError(sourcePath, err);
      throw err;
    }
    if (String(mode).toLowerCase() !== 'delete') {
      throw new EncryptedBackupLiveWriterError(sourcePath);
    }
  } finally {
    if (switched) {
      try {
        probe.pragma('journal_mode = WAL');
      } catch {
        // Best-effort restore; the next store open sets modes anyway.
      }
    }
    if (probe.raw().open) probe.close();
  }

  // 3. Byte copy + torn-copy detection.
  const before = statSync(sourcePath);
  copyFileSync(sourcePath, destPath);
  const after = statSync(sourcePath);
  if (before.mtimeMs !== after.mtimeMs || before.size !== after.size) {
    try {
      unlinkSync(destPath);
    } catch {
      // The torn copy may already be gone; the error below is the signal.
    }
    throw EncryptedBackupLiveWriterError.forConcurrentMutation(sourcePath);
  }

  // 4. Verify the COPY opens with the key and passes the cipher check.
  const verify = await createEncryptedConnection({
    path: destPath,
    skipSqliteVec: true,
    disableWalHardening: true,
    encryption: {
      enabled: true,
      cipher,
      passphraseResolver: async () => options.passphrase,
    },
  });
  let integrityCheck: { readonly ok: boolean; readonly rows: ReadonlyArray<string> };
  try {
    const result = cipherIntegrityCheck(verify);
    integrityCheck = { ok: result.ok, rows: result.rows };
  } finally {
    verify.close();
  }
  if (!integrityCheck.ok) {
    try {
      unlinkSync(destPath);
    } catch {
      // Keep the integrity failure as the primary signal.
    }
    throw new Error(
      '[graphorin/store-sqlite-encrypted] post-backup integrity check failed: ' +
        integrityCheck.rows.join('; '),
    );
  }

  return Object.freeze({
    sourcePath,
    destPath,
    cipher,
    integrityCheck: Object.freeze(integrityCheck),
  });
}

function isBusyError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string' && code.includes('SQLITE_BUSY')) return true;
  const message = (err as { message?: unknown }).message;
  return typeof message === 'string' && message.includes('database is locked');
}

function absolute(p: string): string {
  return isAbsolute(p) ? p : resolve(p);
}
