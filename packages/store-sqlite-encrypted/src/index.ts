/**
 * @graphorin/store-sqlite-encrypted — optional encryption-at-rest
 * sub-pack for the Graphorin framework's default SQLite store.
 *
 * Installing this package pulls in the cipher peer driver
 * (`better-sqlite3-multiple-ciphers@^12.9.0`), which is a drop-in fork
 * of `better-sqlite3` that bundles the SQLite3MultipleCiphers
 * extension (SQLCipher v4 / wxSQLite3 / AES-256-CBC / AES-128-CBC /
 * RC4 cipher modes).
 *
 * The package exposes:
 *
 *  - {@link createEncryptedConnection} — convenience wrapper around
 *    `openConnection` from `@graphorin/store-sqlite/connection` that
 *    pre-loads the cipher peer.
 *  - {@link encryptDatabase} — converts an unencrypted SQLite file
 *    into an encrypted one. Backs `graphorin storage encrypt`.
 *  - {@link rekeyDatabase} — re-keys an already encrypted file. Backs
 *    `graphorin storage rekey`.
 *  - {@link cipherIntegrityCheck} — runs `PRAGMA cipher_integrity_
 *    check`. Used by the triggers daemon's daily verification cron
 *    and the `/v1/health/storage` endpoint.
 *  - {@link DEFAULT_CIPHER}, {@link pragmaSequenceForCipher},
 *    {@link encodePassphraseForPragma} — cipher-config helpers shared
 *    by the runners and consumable for advanced setups.
 *  - {@link loadCipherPeer} / {@link EncryptedStorePeerMissingError} —
 *    explicit peer-loader surface for callers that want to fail-fast
 *    at startup before opening the DB.
 *
 * Defaults follow ADR-030 / DEC-129:
 *  - Cipher: `'sqlcipher'` (SQLCipher v4 compatible, `legacy=4`).
 *  - Default OFF; opt-in through `graphorin init --encrypted`.
 *  - audit.db is ALWAYS encrypted regardless of this opt-in
 *    (DEC-124); this package satisfies that requirement too.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.3.0';

export {
  DEFAULT_CIPHER,
  type EncryptionCipher,
  encodePassphraseForPragma,
  pragmaSequenceForCipher,
} from './cipher-config.js';
export {
  _resetCipherPeerCacheForTesting,
  _setCipherPeerForTesting,
  EncryptedStorePeerMissingError,
  loadCipherPeer,
} from './cipher-peer.js';
export { createEncryptedConnection } from './connection.js';
export {
  type EncryptDatabaseOptions,
  type EncryptDatabaseResult,
  encryptDatabase,
} from './encrypt.js';
export { type CipherIntegrityCheckResult, cipherIntegrityCheck } from './integrity-check.js';
export {
  type RekeyDatabaseOptions,
  type RekeyDatabaseResult,
  rekeyDatabase,
} from './rekey.js';
