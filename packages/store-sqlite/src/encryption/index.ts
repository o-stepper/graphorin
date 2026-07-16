/**
 * Encryption-at-rest interface hooks.
 *
 * Phase 05 declares the surface; the cipher path itself ships in the
 * optional `@graphorin/store-sqlite-encrypted` subpackage in Phase 16
 * (DEC-129 / ADR-030). Default behaviour is **encryption disabled**.
 *
 * If the caller passes `encryption.enabled: true` and the cipher peer
 * (`better-sqlite3-multiple-ciphers`) is missing, the connection layer
 * **fails fast** with {@link CipherPeerMissingError} rather than
 * silently degrading to an unencrypted DB.
 *
 * @packageDocumentation
 */

import type { BetterSqlite3Constructor } from '../driver-types.js';
import { isMissingNativeBindingError, SqliteNativeBindingError } from '../native-binding-error.js';

/**
 * Cipher selection, validated against the real sqlite3mc vocabulary
 * (CS-13 - `'wxsqlite3'` is the library's name, not a cipher; the peer
 * rejects it with "Cipher 'wxsqlite3' unknown"). `'sqlcipher'` is the
 * Graphorin default (SQLCipher v4 compatible); `'chacha20'` is the
 * peer's own default cipher.
 *
 * @stable
 */
export type EncryptionCipher = 'sqlcipher' | 'chacha20' | 'aes256cbc' | 'aes128cbc' | 'rc4';

/**
 * The cipher-selection PRAGMAs that must run **before** `PRAGMA key`
 * on a freshly opened connection (CS-7). sqlite3mc defaults to
 * `chacha20`, so opening a SQLCipher-v4 database with `key` alone
 * reads garbage - every keyed open must pin the cipher first.
 *
 * @stable
 */
export function cipherSelectionPragmas(cipher: EncryptionCipher): ReadonlyArray<string> {
  switch (cipher) {
    case 'sqlcipher':
      return Object.freeze(["cipher = 'sqlcipher'", 'legacy = 4']);
    case 'chacha20':
      return Object.freeze(["cipher = 'chacha20'"]);
    case 'aes256cbc':
      return Object.freeze(["cipher = 'aes256cbc'"]);
    case 'aes128cbc':
      return Object.freeze(["cipher = 'aes128cbc'"]);
    case 'rc4':
      return Object.freeze(["cipher = 'rc4'"]);
    default: {
      const exhaustive: never = cipher;
      throw new Error(`unknown cipher: ${String(exhaustive)}`);
    }
  }
}

/**
 * Encryption-at-rest configuration. Default `{ enabled: false }`.
 *
 * @stable
 */
export type EncryptionConfig =
  | { readonly enabled: false }
  | {
      readonly enabled: true;
      readonly cipher?: EncryptionCipher;
      /**
       * Resolves the passphrase at startup. Returns the raw passphrase
       * string (the caller is responsible for clearing it from memory
       * after the connection is open). Inputs typically come from a
       * `SecretValue` resolver in `@graphorin/security` or from an
       * operator-supplied env var.
       */
      readonly passphraseResolver: PassphraseResolver;
    };

/**
 * Passphrase resolver shape. Implementations live in
 * `@graphorin/security` (`'env:GRAPHORIN_DB_PASSPHRASE'`,
 * `'keyring:graphorin/db'`, …). The resolver may return `Buffer` for
 * binary-keyed cipher variants.
 *
 * @stable
 */
export type PassphraseResolver = () => Promise<string | Buffer>;

/**
 * Raised when the operator opts in to encryption-at-rest but the
 * cipher peer (`better-sqlite3-multiple-ciphers`) is missing. The
 * Phase 05 acceptance criteria require this to be a fatal startup
 * error - never silently downgrade to an unencrypted DB.
 *
 * @stable
 */
export class CipherPeerMissingError extends Error {
  override readonly name = 'CipherPeerMissingError';
}

/**
 * Loads the cipher peer (`better-sqlite3-multiple-ciphers`). Lazy by
 * design - the import only fires when encryption-at-rest is enabled.
 *
 * @stable
 */
export async function loadCipherDriver(): Promise<BetterSqlite3Constructor> {
  try {
    const mod = (await import('better-sqlite3-multiple-ciphers')) as unknown as {
      default: BetterSqlite3Constructor;
    };
    return mod.default;
  } catch (err) {
    // Audit 2026-07-16 P1-3: an installed-but-unbuilt cipher peer (pnpm
    // 10 skipped its build script) is NOT a missing peer - reporting it
    // as one sends the operator to reinstall a package that is already
    // there. Surface the skipped-build fix instead.
    if (isMissingNativeBindingError(err)) {
      throw new SqliteNativeBindingError('better-sqlite3-multiple-ciphers', err);
    }
    throw new CipherPeerMissingError(
      "encryption-at-rest is enabled but the cipher peer 'better-sqlite3-multiple-ciphers' is not installed. " +
        'Install the optional `@graphorin/store-sqlite-encrypted` subpackage or add the peer manually.',
      { cause: err },
    );
  }
}

/**
 * Resolves the configured passphrase to a SQL-literal-ready value
 * suitable for `PRAGMA key = <literal>`. UTF-8 passphrases are returned
 * as a single-quoted SQL string with internal `'` doubled; binary keys
 * are returned in the cipher peer's hex form (`x'<hex>'`).
 *
 * @stable
 */
export async function resolvePassphrase(config: EncryptionConfig): Promise<string> {
  if (!config.enabled) {
    throw new Error('[graphorin/store-sqlite] resolvePassphrase called while encryption disabled');
  }
  const resolved = await config.passphraseResolver();
  if (typeof resolved === 'string') {
    if (resolved.length === 0) {
      throw new Error('[graphorin/store-sqlite] resolved passphrase is empty');
    }
    return `'${resolved.replace(/'/g, "''")}'`;
  }
  if (resolved.length === 0) {
    throw new Error('[graphorin/store-sqlite] resolved passphrase is empty');
  }
  return `x'${resolved.toString('hex')}'`;
}
