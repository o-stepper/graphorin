[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / backupEncryptedDatabase

# Function: backupEncryptedDatabase()

```ts
function backupEncryptedDatabase(options): Promise<BackupEncryptedDatabaseResult>;
```

Defined in: packages/store-sqlite-encrypted/src/backup.ts:119

**`Stable`**

Takes a consistent, still-encrypted backup copy of an encrypted
database. Requires a stopped server: throws
[EncryptedBackupLiveWriterError](/api/@graphorin/store-sqlite-encrypted/classes/EncryptedBackupLiveWriterError.md) when another holder is
detected at any layer of the guard. Also throws if the file is
missing, the cipher peer cannot be loaded, the passphrase is wrong
(`SQLITE_NOTADB` on the first read), or the post-copy integrity
check fails.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`BackupEncryptedDatabaseOptions`](/api/@graphorin/store-sqlite-encrypted/interfaces/BackupEncryptedDatabaseOptions.md) |

## Returns

`Promise`\&lt;[`BackupEncryptedDatabaseResult`](/api/@graphorin/store-sqlite-encrypted/interfaces/BackupEncryptedDatabaseResult.md)\&gt;
