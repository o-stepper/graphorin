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

import type { BetterSqlite3Constructor } from '@graphorin/store-sqlite/connection';

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
   * `${sourcePath}.bak.${timestamp}` (WAL/SHM sidecars move with it)
   * so an operator can recover. Default `false` - the CLI does the
   * swap explicitly.
   *
   * REQUIRES A STOPPED SERVER: a live writer keeps its file
   * descriptor on the renamed `.bak` inode and every post-snapshot
   * commit silently diverges from the new encrypted file (and is later
   * deleted by `storage cleanup-backups`). A fail-closed live-writer
   * check refuses the swap with {@link EncryptSwapLiveWriterError}
   * while ANY other connection holds the database - WAL sidecar
   * presence first (also refuses after an unclean shutdown), then a
   * journal-mode probe - once before the copy and again immediately
   * before the rename pair, so the remaining check-to-rename race is
   * microseconds wide. Treat the check as a seatbelt, not a lock:
   * stop every writer first.
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

  /**
   * deep-retest-0.13.10 P0: raised by the sidecar layer of the
   * live-writer check. WAL sidecars are deleted when the LAST
   * connection closes, so their presence means the database is open
   * right now or the previous holder exited uncleanly - either way an
   * in-place swap is unsafe.
   */
  static forSidecars(
    sourcePath: string,
    present: ReadonlyArray<string>,
  ): EncryptSwapLiveWriterError {
    const err = new EncryptSwapLiveWriterError(sourcePath);
    err.message =
      `[graphorin/store-sqlite-encrypted] WAL sidecar file(s) present next to ${sourcePath} ` +
      `(${present.join(', ')}): the database is open by another connection, or its last holder ` +
      'exited uncleanly. Stop every writer (including the server), then open the database once ' +
      '(for example `graphorin storage status`) so SQLite recovers and removes the sidecars, ' +
      'and retry the swap.';
    return err;
  }

  constructor(sourcePath: string, cause?: unknown) {
    super(
      `[graphorin/store-sqlite-encrypted] ${sourcePath} appears to be open by another process; ` +
        'stop the server before running storage encrypt with --swap (writes committed after the ' +
        'snapshot would land in the renamed .bak file and be lost).',
      cause === undefined ? undefined : { cause },
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
  // so probe for one FIRST (fail fast, before the slow copy+rekey).
  if (options.swap === true) {
    assertNoLiveWriter(Ctor, sourcePath);
  }

  try {
    // 1+2. Online page-level copy via the driver's backup API
    //    (store-05). The old checkpoint-close-then-copyFileSync left a
    //    window in which a concurrent writer (a running daemon) could
    //    commit WAL frames the byte-copy silently missed; `backup()`
    //    is consistent under live writers, preserves rowids (FTS5
    //    mappings survive), and includes WAL content.
    //    Opened read-WRITE on purpose (deep-retest-0.13.10 P0): a
    //    readonly connection cannot delete the WAL sidecars it
    //    created, and leftovers here would trip the pre-rename
    //    sidecar check on the swap path. Read-write, the close below
    //    checkpoints and removes them when (and only when) this is
    //    the last connection - exactly the invariant the swap check
    //    relies on. Only `backup()` is ever invoked on this handle.
    const source = new Ctor(sourcePath);
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
    // deep-retest-0.13.10 P0: re-probe IMMEDIATELY before the rename
    // pair. The first probe ran before the (slow) copy+rekey+verify
    // steps; a writer that opened in between would keep committing
    // into the renamed .bak inode. This shrinks the residual
    // probe-to-rename window to microseconds.
    try {
      assertNoLiveWriter(Ctor, sourcePath);
    } catch (err) {
      if (existsSync(targetPath)) {
        try {
          unlinkSync(targetPath);
        } catch {
          // best-effort cleanup
        }
      }
      throw err;
    }
    const ts = Date.now();
    const renamedTo = `${sourcePath}.bak.${ts}`;
    renameSync(sourcePath, renamedTo);
    // deep-retest-0.13.10 P0: WAL/SHM sidecars follow the main file.
    // Left at `<source>-wal`, any frames a leaked pre-swap handle
    // later commits are orphaned - their salts match neither the
    // backup (renamed away) nor the encrypted replacement, so the
    // next open silently discards them. Moved next to the backup,
    // those frames stay recoverable together with it.
    for (const suffix of ['-wal', '-shm']) {
      const sidecar = `${sourcePath}${suffix}`;
      if (existsSync(sidecar)) {
        try {
          renameSync(sidecar, `${renamedTo}${suffix}`);
        } catch {
          // best-effort - a failed sidecar rename never blocks the swap
        }
      }
    }
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

/**
 * W-012 + deep-retest-0.13.10 P0: refuses to proceed while ANY other
 * connection holds the source database. Two layers, because no single
 * signal is trustworthy across every process/driver combination:
 *
 * Layer 1 - WAL sidecar presence. SQLite removes `-wal`/`-shm` when
 * the LAST connection closes, so their existence means the database
 * is open right now or its previous holder exited uncleanly - both
 * make an in-place swap unsafe. This layer is immune to the locking
 * blind spot below and MUST run before the probe connection opens
 * (the probe itself would create the sidecars it checks for).
 *
 * Layer 2 - journal-mode switch probe. Leaving WAL requires locks a
 * holder denies, which makes `PRAGMA journal_mode = DELETE` a cheap
 * liveness probe for cross-PROCESS holders: the switch throws
 * "database is locked" or silently returns 'wal' (only an actual
 * 'delete' result proves exclusive access - the returned value is
 * part of the contract, not just the throw). It is NOT sufficient
 * alone: POSIX fcntl locks never conflict within one process, and
 * the cipher peer embeds a SEPARATE SQLite build from the plain
 * `better-sqlite3` the server links, so a same-process cross-driver
 * holder can let the switch through entirely (hand-verified in
 * `cross-driver-swap.test.ts`) - that case is exactly what layer 1
 * catches, since any holder that has executed a statement keeps its
 * sidecars on disk. The mode is restored in `finally` so a crash
 * mid-probe cannot leave the file in DELETE mode.
 */
function assertNoLiveWriter(Ctor: BetterSqlite3Constructor, sourcePath: string): void {
  const present = ['-wal', '-shm'].map((s) => `${sourcePath}${s}`).filter((p) => existsSync(p));
  if (present.length > 0) {
    throw EncryptSwapLiveWriterError.forSidecars(sourcePath, present);
  }

  const probe = new Ctor(sourcePath);
  let switched = false;
  try {
    let mode: unknown;
    try {
      mode = probe.pragma('journal_mode = DELETE', { simple: true });
      switched = true;
    } catch (err) {
      if (isBusyError(err)) throw new EncryptSwapLiveWriterError(sourcePath, err);
      throw err;
    }
    if (String(mode).toLowerCase() !== 'delete') {
      throw new EncryptSwapLiveWriterError(sourcePath);
    }
  } finally {
    if (switched) {
      try {
        probe.pragma('journal_mode = WAL');
      } catch {
        // The WAL restore is best-effort; the conversion in
        // `encryptDatabase` sets journal modes explicitly anyway.
      }
    }
    if (probe.open) probe.close();
  }
}

function isBusyError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string' && code.includes('SQLITE_BUSY')) return true;
  const message = (err as { message?: unknown }).message;
  return typeof message === 'string' && /database is locked|busy/i.test(message);
}
