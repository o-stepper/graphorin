[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / BackupEncryptedDatabaseResult

# Interface: BackupEncryptedDatabaseResult

Defined in: packages/store-sqlite-encrypted/src/backup.ts:101

**`Stable`**

Result of a successful [backupEncryptedDatabase](/api/@graphorin/store-sqlite-encrypted/functions/backupEncryptedDatabase.md) run.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher` | `readonly` | [`EncryptionCipher`](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) | packages/store-sqlite-encrypted/src/backup.ts:104 |
| <a id="property-destpath"></a> `destPath` | `readonly` | `string` | packages/store-sqlite-encrypted/src/backup.ts:103 |
| <a id="property-integritycheck"></a> `integrityCheck` | `readonly` | \{ `ok`: `boolean`; `rows`: readonly `string`[]; \} | packages/store-sqlite-encrypted/src/backup.ts:105 |
| `integrityCheck.ok` | `readonly` | `boolean` | packages/store-sqlite-encrypted/src/backup.ts:105 |
| `integrityCheck.rows` | `readonly` | readonly `string`[] | packages/store-sqlite-encrypted/src/backup.ts:105 |
| <a id="property-sourcepath"></a> `sourcePath` | `readonly` | `string` | packages/store-sqlite-encrypted/src/backup.ts:102 |
