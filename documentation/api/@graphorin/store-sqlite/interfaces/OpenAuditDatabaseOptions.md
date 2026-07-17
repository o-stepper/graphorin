[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / OpenAuditDatabaseOptions

# Interface: OpenAuditDatabaseOptions

Defined in: [packages/store-sqlite/src/audit-db.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/audit-db.ts#L19)

Options for [openAuditDatabase](/api/@graphorin/store-sqlite/functions/openAuditDatabase.md). The audit database is **always
encrypted** (DEC-124); if the cipher peer is missing the call fails
fast with [CipherPeerMissingError](/api/@graphorin/store-sqlite/encryption/classes/CipherPeerMissingError.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cipherloader"></a> `cipherLoader?` | `readonly` | () => `Promise`\&lt;[`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md)\&gt; | **`Internal`** Optional cipher-driver loader override. When unset the function defers to the canonical [loadCipherDriver](/api/@graphorin/store-sqlite/encryption/functions/loadCipherDriver.md). Used by the test suite to simulate a missing cipher peer without uninstalling the package from the workspace. | [packages/store-sqlite/src/audit-db.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/audit-db.ts#L33) |
| <a id="property-driver"></a> `driver?` | `readonly` | [`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md) | Optional driver override for tests. | [packages/store-sqlite/src/audit-db.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/audit-db.ts#L24) |
| <a id="property-encryption"></a> `encryption` | `readonly` | \{ `cipher?`: [`EncryptionCipher`](/api/@graphorin/store-sqlite/encryption/type-aliases/EncryptionCipher.md); `enabled`: `true`; `passphraseResolver`: [`PassphraseResolver`](/api/@graphorin/store-sqlite/encryption/type-aliases/PassphraseResolver.md); \} | Cipher / passphrase resolver - required because audit.db is encrypted. | [packages/store-sqlite/src/audit-db.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/audit-db.ts#L22) |
| `encryption.cipher?` | `readonly` | [`EncryptionCipher`](/api/@graphorin/store-sqlite/encryption/type-aliases/EncryptionCipher.md) | - | [packages/store-sqlite/src/encryption/index.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/encryption/index.ts#L66) |
| `encryption.enabled` | `readonly` | `true` | - | [packages/store-sqlite/src/encryption/index.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/encryption/index.ts#L65) |
| `encryption.passphraseResolver` | `readonly` | [`PassphraseResolver`](/api/@graphorin/store-sqlite/encryption/type-aliases/PassphraseResolver.md) | Resolves the passphrase at startup. Returns the raw passphrase string (the caller is responsible for clearing it from memory after the connection is open). Inputs typically come from a `SecretValue` resolver in `@graphorin/security` or from an operator-supplied env var. | [packages/store-sqlite/src/encryption/index.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/encryption/index.ts#L74) |
| <a id="property-path"></a> `path` | `readonly` | `string` | - | [packages/store-sqlite/src/audit-db.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/audit-db.ts#L20) |
