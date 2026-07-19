/**
 * `encryptDatabase` - converts an unencrypted SQLite database file
 * into an encrypted one. Backs `graphorin storage encrypt` per
 * ADR-030 § 8.
 *
 * Strategy: sqlite3mc ships **no** `sqlcipher_export` function
 * (verified against the real peer - the old ATTACH+export path threw
 * "no such function" on every real run), so the export is a
 * **checkpoint → file copy → in-place `PRAGMA rekey`** sequence:
 *
 *  1. open the plaintext source, `wal_checkpoint(TRUNCATE)`, close;
 *  2. byte-copy the file to the target (this trivially preserves every
 *     rowid, so FTS5 external-content mappings stay intact);
 *  3. open the copy through the cipher peer with NO key, apply the
 *     cipher-selection pragmas, then `PRAGMA rekey = <key>` - sqlite3mc
 *     encrypts a plaintext database in place;
 *  4. re-open with the key and verify via `PRAGMA integrity_check`.
 *
 * @packageDocumentation
 */

import { existsSync, renameSync, unlinkSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import {
  DEFAULT_CIPHER,
  type EncryptionCipher,
  encodePassphraseForPragma,
  pragmaSequenceForCipher,
} from './cipher-config.js';
import { loadCipherPeer } from './cipher-peer.js';
import { createEncryptedConnection } from './connection.js';
import { cipherIntegrityCheck } from './integrity-check.js';

/**
 * Options for {@link encryptDatabase}.
 *
 * @stable
 */
export interface EncryptDatabaseOptions {
  /** Path to the existing unencrypted source DB. */
  readonly sourcePath: string;
  /** Path the encrypted output is written to. Must not exist. */
  readonly targetPath: string;
  /** Passphrase for the new encrypted DB. */
  readonly passphrase: string | Buffer;
  /** Cipher selection. Default `'sqlcipher'` (SQLCipher v4 compatible). */
  readonly cipher?: EncryptionCipher;
  /**
   * If `true`, atomically rename `targetPath` -> `sourcePath` after the
   * integrity check passes. The original `sourcePath` is renamed to
   * `${sourcePath}.bak.${timestamp}` so an operator can recover.
   * Default `false` - the CLI does the swap explicitly.
   *
   * REQUIRES A STOPPED SERVER: a live writer keeps its file
   * descriptor on the renamed `.bak` inode and every post-snapshot
   * commit silently diverges from the new encrypted file (and is later
   * deleted by `storage cleanup-backups`). A best-effort live-writer
   * probe refuses the swap with {@link EncryptSwapLiveWriterError}
   * when another connection holds the database; the probe-to-rename
   * window remains a documented residual race.
   */
  readonly swap?: boolean;
  /**
   * If `true`, overwrite an existing `targetPath` instead of failing.
   * Default `false`.
   */
  readonly overwriteTarget?: boolean;
}

/**
 * Result of a successful {@link encryptDatabase} run.
 *
 * @stable
 */
export interface EncryptDatabaseResult {
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly cipher: EncryptionCipher;
  readonly integrityCheck: { readonly ok: boolean; readonly rows: ReadonlyArray<string> };
  readonly swap?: { readonly originalRenamedTo: string };
}

/**
 * Encrypts an unencrypted SQLite database. Returns once the target
 * file has been written and verified. Throws if the source is missing,
 * the target already exists (and `overwriteTarget` is unset), the
 * cipher peer is missing, or the integrity check fails.
 *
 * @stable
 */
/**
 * Thrown when `encryptDatabase({ swap: true })` detects another live
 * connection on the source database. The swap path renames the
 * source file; a live writer would keep writing into the renamed
 * `.bak.<ts>` inode and silently diverge from the encrypted copy.
 *
 * @stable
 */
export class EncryptSwapLiveWriterError extends Error {
  readonly sourcePath: string;
  constructor(sourcePath: string, cause: unknown) {
    super(
      `[graphorin/store-sqlite-encrypted] ${sourcePath} appears to be open by another process; ` +
        'stop the server before running storage encrypt with --swap (writes committed after the ' +
        'snapshot would land in the renamed .bak file and be lost).',
      { cause },
    );
    this.name = 'EncryptSwapLiveWriterError';
    this.sourcePath = sourcePath;
  }
}

export async function encryptDatabase(
  options: EncryptDatabaseOptions,
): Promise<EncryptDatabaseResult> {
  const sourcePath = absolute(options.sourcePath);
  const targetPath = absolute(options.targetPath);
  const cipher = options.cipher ?? DEFAULT_CIPHER;

  if (!existsSync(sourcePath)) {
    throw new Error(`[graphorin/store-sqlite-encrypted] source DB not found: ${sourcePath}`);
  }
  if (sourcePath === targetPath) {
    throw new Error(
      '[graphorin/store-sqlite-encrypted] sourcePath and targetPath must differ. ' +
        'Pass a temporary targetPath then enable `swap: true` to atomically replace the source.',
    );
  }
  if (existsSync(targetPath)) {
    if (options.overwriteTarget !== true) {
      throw new Error(
        `[graphorin/store-sqlite-encrypted] target DB already exists: ${targetPath}. ` +
          'Pass `overwriteTarget: true` to replace it.',
      );
    }
    unlinkSync(targetPath);
  }

  const Ctor = await loadCipherPeer();

  // W-012: --swap renames the source out from under any live writer,
  // so probe for one FIRST. Empirically (real sqlite3mc peer): a
  // journal-mode switch is refused with "database is locked" while any
  // other connection is open, making it a cheap liveness probe. The
  // mode is restored in `finally` so a crash mid-probe cannot leave the
  // file in DELETE mode. Best-effort: the probe-to-rename window stays.
  if (options.swap === true) {
    const probe = new Ctor(sourcePath);
    let switched = false;
    try {
      try {
        probe.pragma('journal_mode = DELETE');
        switched = true;
      } catch (err) {
        if (isBusyError(err)) throw new EncryptSwapLiveWriterError(sourcePath, err);
        throw err;
      }
    } finally {
      if (switched) {
        try {
          probe.pragma('journal_mode = WAL');
        } catch {
          // The WAL restore is best-effort; the conversion below sets
          // journal modes explicitly anyway.
        }
      }
      if (probe.open) probe.close();
    }
  }

  try {
    // 1+2. Online page-level copy via the driver's backup API
    //    (store-05). The old checkpoint-close-then-copyFileSync left a
    //    window in which a concurrent writer (a running daemon) could
    //    commit WAL frames the byte-copy silently missed; `backup()`
    //    is consistent under live writers, preserves rowids (FTS5
    //    mappings survive), and includes WAL content.
    const source = new Ctor(sourcePath, { readonly: true });
    try {
      await source.backup(targetPath);
    } finally {
      if (source.open) source.close();
    }

    // 3. In-place conversion: cipher pragmas first, then `rekey` -
    //    sqlite3mc encrypts a plaintext database in place.
    const target = new Ctor(targetPath);
    try {
      for (const pragma of pragmaSequenceForCipher(cipher)) {
        target.pragma(pragma);
      }
      // sqlite3mc refuses `rekey` in WAL journal mode (real-peer
      // verified) - drop to DELETE for the conversion, restore after.
      target.pragma('journal_mode = DELETE');
      const encodedKey = encodePassphraseForPragma(options.passphrase);
      target.pragma(`rekey = ${encodedKey}`);
      target.pragma('journal_mode = WAL');
    } finally {
      if (target.open) target.close();
    }
  } catch (err) {
    if (existsSync(targetPath)) {
      try {
        unlinkSync(targetPath);
      } catch {
        // best-effort cleanup
      }
    }
    throw new Error(
      `[graphorin/store-sqlite-encrypted] encryption failed: ${(err as Error).message}`,
      { cause: err },
    );
  }

  const verify = await createEncryptedConnection({
    path: targetPath,
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
    if (existsSync(targetPath)) {
      try {
        unlinkSync(targetPath);
      } catch {
        // best-effort cleanup
      }
    }
    throw new Error(
      '[graphorin/store-sqlite-encrypted] post-encrypt integrity check failed: ' +
        integrityCheck.rows.join('; '),
    );
  }

  let swap: { readonly originalRenamedTo: string } | undefined;
  if (options.swap === true) {
    const ts = Date.now();
    const renamedTo = `${sourcePath}.bak.${ts}`;
    renameSync(sourcePath, renamedTo);
    renameSync(targetPath, sourcePath);
    swap = Object.freeze({ originalRenamedTo: renamedTo });
  }

  const out: EncryptDatabaseResult = Object.freeze({
    sourcePath,
    targetPath: swap !== undefined ? sourcePath : targetPath,
    cipher,
    integrityCheck: Object.freeze(integrityCheck),
    ...(swap !== undefined ? { swap } : {}),
  });
  return out;
}

function absolute(p: string): string {
  return isAbsolute(p) ? p : resolve(p);
}

function isBusyError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string' && code.includes('SQLITE_BUSY')) return true;
  const message = (err as { message?: unknown }).message;
  return typeof message === 'string' && /database is locked|busy/i.test(message);
}
