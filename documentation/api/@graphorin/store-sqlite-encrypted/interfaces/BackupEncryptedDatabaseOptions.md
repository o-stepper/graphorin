[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / BackupEncryptedDatabaseOptions

# Interface: BackupEncryptedDatabaseOptions

Defined in: packages/store-sqlite-encrypted/src/backup.ts:85

**`Stable`**

Options for [backupEncryptedDatabase](/api/@graphorin/store-sqlite-encrypted/functions/backupEncryptedDatabase.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher?` | `readonly` | [`EncryptionCipher`](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) | Cipher selection. Default `'sqlcipher'`. | packages/store-sqlite-encrypted/src/backup.ts:93 |
| <a id="property-destpath"></a> `destPath` | `readonly` | `string` | Destination path for the backup copy (overwritten if present). | packages/store-sqlite-encrypted/src/backup.ts:89 |
| <a id="property-passphrase"></a> `passphrase` | `readonly` | `string` \| `Buffer`\&lt;`ArrayBufferLike`\&gt; | Passphrase the DB is encrypted with. | packages/store-sqlite-encrypted/src/backup.ts:91 |
| <a id="property-sourcepath"></a> `sourcePath` | `readonly` | `string` | Path to the encrypted source DB. | packages/store-sqlite-encrypted/src/backup.ts:87 |
