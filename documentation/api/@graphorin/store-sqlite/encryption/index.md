[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / encryption

# encryption

Encryption-at-rest interface hooks.

Phase 05 declares the surface; the cipher path itself ships in the
optional `@graphorin/store-sqlite-encrypted` subpackage in Phase 16
(DEC-129 / ADR-030). Default behaviour is **encryption disabled**.

If the caller passes `encryption.enabled: true` and the cipher peer
(`better-sqlite3-multiple-ciphers`) is missing, the connection layer
**fails fast** with [CipherPeerMissingError](/api/@graphorin/store-sqlite/encryption/classes/CipherPeerMissingError.md) rather than
silently degrading to an unencrypted DB.

## Classes

| Class | Description |
| ------ | ------ |
| [CipherPeerMissingError](/api/@graphorin/store-sqlite/encryption/classes/CipherPeerMissingError.md) | Raised when the operator opts in to encryption-at-rest but the cipher peer (`better-sqlite3-multiple-ciphers`) is missing. The Phase 05 acceptance criteria require this to be a fatal startup error - never silently downgrade to an unencrypted DB. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [EncryptionCipher](/api/@graphorin/store-sqlite/encryption/type-aliases/EncryptionCipher.md) | Cipher selection, validated against the real sqlite3mc vocabulary (CS-13 - `'wxsqlite3'` is the library's name, not a cipher; the peer rejects it with "Cipher 'wxsqlite3' unknown"). `'sqlcipher'` is the Graphorin default (SQLCipher v4 compatible); `'chacha20'` is the peer's own default cipher. |
| [EncryptionConfig](/api/@graphorin/store-sqlite/encryption/type-aliases/EncryptionConfig.md) | Encryption-at-rest configuration. Default `{ enabled: false }`. |
| [PassphraseResolver](/api/@graphorin/store-sqlite/encryption/type-aliases/PassphraseResolver.md) | Passphrase resolver shape. Implementations live in `@graphorin/security` (`'env:GRAPHORIN_DB_PASSPHRASE'`, `'keyring:graphorin/db'`, …). The resolver may return `Buffer` for binary-keyed cipher variants. |

## Functions

| Function | Description |
| ------ | ------ |
| [cipherSelectionPragmas](/api/@graphorin/store-sqlite/encryption/functions/cipherSelectionPragmas.md) | The cipher-selection PRAGMAs that must run **before** `PRAGMA key` on a freshly opened connection (CS-7). sqlite3mc defaults to `chacha20`, so opening a SQLCipher-v4 database with `key` alone reads garbage - every keyed open must pin the cipher first. |
| [loadCipherDriver](/api/@graphorin/store-sqlite/encryption/functions/loadCipherDriver.md) | Loads the cipher peer (`better-sqlite3-multiple-ciphers`). Lazy by design - the import only fires when encryption-at-rest is enabled. |
| [resolvePassphrase](/api/@graphorin/store-sqlite/encryption/functions/resolvePassphrase.md) | Resolves the configured passphrase to a SQL-literal-ready value suitable for `PRAGMA key = <literal>`. UTF-8 passphrases are returned as a single-quoted SQL string with internal `'` doubled; binary keys are returned in the cipher peer's hex form (`x'<hex>'`). |
