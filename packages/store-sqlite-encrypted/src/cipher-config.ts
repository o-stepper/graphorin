/**
 * Cipher selection + passphrase encoding helpers shared by the
 * `createEncryptedConnection`, `encryptDatabase`, and `rekeyDatabase`
 * runners. The cipher peer reads the passphrase via `PRAGMA key`; this
 * module owns the SQL-literal escaping path so all three runners agree.
 *
 * @packageDocumentation
 */

import type { EncryptionCipher } from '@graphorin/store-sqlite/encryption';

export type { EncryptionCipher };

/**
 * Default cipher. Matches ADR-030 § 2 — SQLCipher v4 compatible
 * (AES-256-CBC + HMAC-SHA1, `legacy=4` parameter set).
 *
 * @stable
 */
export const DEFAULT_CIPHER: EncryptionCipher = 'sqlcipher';

/**
 * Cipher-specific PRAGMAs that must be applied **immediately after**
 * `PRAGMA key = ...` for SQLite3MultipleCiphers to interpret the key
 * correctly. The list mirrors the upstream documentation.
 *
 * @internal
 */
const CIPHER_PRAGMAS: Readonly<Record<EncryptionCipher, ReadonlyArray<string>>> = Object.freeze({
  sqlcipher: Object.freeze(["cipher = 'sqlcipher'", 'legacy = 4']),
  wxsqlite3: Object.freeze(["cipher = 'wxsqlite3'"]),
  aes256cbc: Object.freeze(["cipher = 'aes256cbc'"]),
  aes128cbc: Object.freeze(["cipher = 'aes128cbc'"]),
  rc4: Object.freeze(["cipher = 'rc4'"]),
});

/**
 * Returns the PRAGMA statements that select a cipher. The list is
 * applied **before** `PRAGMA key = ...` so the cipher peer knows which
 * KDF / mode to use when interpreting the key bytes.
 *
 * @stable
 */
export function pragmaSequenceForCipher(cipher: EncryptionCipher): ReadonlyArray<string> {
  const seq = CIPHER_PRAGMAS[cipher];
  if (seq === undefined) {
    throw new TypeError(
      `[graphorin/store-sqlite-encrypted] unknown cipher '${String(cipher)}'. ` +
        `Supported: ${Object.keys(CIPHER_PRAGMAS).join(', ')}.`,
    );
  }
  return seq;
}

/**
 * SQL-literal-encodes a passphrase for use as the right-hand side of
 * `PRAGMA key = ...`.
 *
 * - String input is wrapped in single quotes with internal `'` doubled
 *   per the SQL specification.
 * - Buffer input is encoded as the cipher peer's `x'<hex>'` blob form
 *   so binary keys round-trip exactly.
 *
 * Empty inputs are rejected at this layer so callers cannot
 * accidentally open an unencrypted DB with an empty key.
 *
 * @stable
 */
export function encodePassphraseForPragma(value: string | Buffer): string {
  if (typeof value === 'string') {
    if (value.length === 0) {
      throw new Error('[graphorin/store-sqlite-encrypted] passphrase is empty');
    }
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (value.length === 0) {
    throw new Error('[graphorin/store-sqlite-encrypted] passphrase buffer is empty');
  }
  return `x'${value.toString('hex')}'`;
}
