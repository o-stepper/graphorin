/**
 * `rekeyDatabase` — re-keys an already encrypted SQLite database. The
 * runner backs `graphorin storage rekey`.
 *
 * Strategy: open the DB through the cipher peer with the **old** key,
 * then issue `PRAGMA rekey = <new>;`. The cipher peer rewrites every
 * page transactionally. After the pragma we re-open the DB with the
 * new key and run `PRAGMA cipher_integrity_check` to confirm the
 * rotation succeeded.
 *
 * @packageDocumentation
 */

import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import {
  DEFAULT_CIPHER,
  type EncryptionCipher,
  encodePassphraseForPragma,
} from './cipher-config.js';
import { loadCipherPeer } from './cipher-peer.js';
import { createEncryptedConnection } from './connection.js';
import { cipherIntegrityCheck } from './integrity-check.js';

/**
 * Options for {@link rekeyDatabase}.
 *
 * @stable
 */
export interface RekeyDatabaseOptions {
  /** Path to the encrypted DB. */
  readonly path: string;
  /** Existing passphrase the DB is currently encrypted with. */
  readonly oldPassphrase: string | Buffer;
  /** New passphrase to apply. */
  readonly newPassphrase: string | Buffer;
  /** Cipher selection. Default `'sqlcipher'`. */
  readonly cipher?: EncryptionCipher;
}

/**
 * Result of a successful {@link rekeyDatabase} run.
 *
 * @stable
 */
export interface RekeyDatabaseResult {
  readonly path: string;
  readonly cipher: EncryptionCipher;
  readonly integrityCheck: { readonly ok: boolean; readonly rows: ReadonlyArray<string> };
}

/**
 * Re-keys an encrypted SQLite database. Throws if the file is missing,
 * the cipher peer cannot be loaded, the old passphrase is wrong (the
 * cipher peer raises `SQLITE_NOTADB` on the first read), or the
 * post-rekey integrity check fails.
 *
 * @stable
 */
export async function rekeyDatabase(options: RekeyDatabaseOptions): Promise<RekeyDatabaseResult> {
  const path = absolute(options.path);
  const cipher = options.cipher ?? DEFAULT_CIPHER;

  if (!existsSync(path)) {
    throw new Error(`[graphorin/store-sqlite-encrypted] DB not found: ${path}`);
  }

  await loadCipherPeer();

  const conn = await createEncryptedConnection({
    path,
    skipSqliteVec: true,
    disableWalHardening: true,
    encryption: {
      enabled: true,
      cipher,
      passphraseResolver: async () => options.oldPassphrase,
    },
  });
  try {
    // Sanity-read forces the cipher peer to verify the old key before
    // we rewrite pages with the new one.
    conn.pragma('user_version');
    // sqlite3mc refuses `rekey` in WAL journal mode (real-peer
    // verified) — drop to DELETE for the rotation, restore after.
    conn.pragma('journal_mode = DELETE');
    const newEncoded = encodePassphraseForPragma(options.newPassphrase);
    conn.pragma(`rekey = ${newEncoded}`);
    conn.pragma('journal_mode = WAL');
  } catch (err) {
    if (conn.raw().open) conn.close();
    throw new Error(`[graphorin/store-sqlite-encrypted] rekey failed: ${(err as Error).message}`, {
      cause: err,
    });
  } finally {
    if (conn.raw().open) conn.close();
  }

  const verify = await createEncryptedConnection({
    path,
    skipSqliteVec: true,
    disableWalHardening: true,
    encryption: {
      enabled: true,
      cipher,
      passphraseResolver: async () => options.newPassphrase,
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
    throw new Error(
      '[graphorin/store-sqlite-encrypted] post-rekey integrity check failed: ' +
        integrityCheck.rows.join('; '),
    );
  }

  return Object.freeze({ path, cipher, integrityCheck: Object.freeze(integrityCheck) });
}

function absolute(p: string): string {
  return isAbsolute(p) ? p : resolve(p);
}
