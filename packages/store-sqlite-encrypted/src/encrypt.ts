/**
 * `encryptDatabase` — converts an unencrypted SQLite database file
 * into an encrypted one. Backs `graphorin storage encrypt` per
 * ADR-030 § 8.
 *
 * Strategy: open the source DB through the cipher peer (which can read
 * unencrypted SQLite files transparently when no key is applied),
 * `ATTACH` an empty target with the desired cipher key, then call the
 * `sqlcipher_export` bundled function (available in every cipher mode
 * of `better-sqlite3-multiple-ciphers`, not just SQLCipher itself —
 * upstream rebrands the function for portability). Finally, re-open
 * the target through the cipher peer with the key applied and run
 * `PRAGMA cipher_integrity_check` to verify.
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
   * Default `false` — the CLI does the swap explicitly.
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
  // Open the source through the cipher peer (no key applied). The
  // peer reads unencrypted DBs transparently in this mode.
  const source = new Ctor(sourcePath);
  try {
    const encodedKey = encodePassphraseForPragma(options.passphrase);
    const escapedTarget = targetPath.replace(/'/g, "''");
    source.exec(`ATTACH DATABASE '${escapedTarget}' AS enc KEY ${encodedKey};`);
    for (const pragma of pragmaSequenceForCipher(cipher)) {
      source.pragma(`enc.${pragma}`);
    }
    source.exec("SELECT sqlcipher_export('enc');");
    source.exec('DETACH DATABASE enc;');
  } catch (err) {
    if (source.open) source.close();
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
  } finally {
    if (source.open) source.close();
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
      '[graphorin/store-sqlite-encrypted] cipher_integrity_check failed: ' +
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
