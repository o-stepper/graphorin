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

/**
 * Cipher selection. The default `'sqlcipher'` mirrors the most-shipped
 * variant of `better-sqlite3-multiple-ciphers`. Other variants
 * (`'wxsqlite3'`, `'rc4'`, …) are accepted by the cipher peer; we
 * validate the string only at the resolver boundary.
 *
 * @stable
 */
export type EncryptionCipher = 'sqlcipher' | 'wxsqlite3' | 'aes256cbc' | 'aes128cbc' | 'rc4';

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
 * error — never silently downgrade to an unencrypted DB.
 *
 * @stable
 */
export class CipherPeerMissingError extends Error {
  override readonly name = 'CipherPeerMissingError';
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

/**
 * Loads the cipher peer (`better-sqlite3-multiple-ciphers`). Lazy by
 * design — the import only fires when encryption-at-rest is enabled.
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
