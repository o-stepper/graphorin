[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runStorageBackup

# Function: runStorageBackup()

```ts
function runStorageBackup(options): Promise<StorageBackupResult>;
```

Defined in: packages/cli/src/commands/storage.ts:157

store-02: online backup via the driver's page-level `backup()` API —
consistent under a live writer (the daemon can keep running),
preserves rowids so FTS5 external-content mappings survive, and for
an encrypted store produces an equally-encrypted copy (same key).
This is the ONLY supported SQL-level backup: `VACUUM INTO`
renumbers rowids and corrupts the FTS mapping on restore.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`StorageBackupOptions`](/api/@graphorin/cli/interfaces/StorageBackupOptions.md) |

## Returns

`Promise`\&lt;[`StorageBackupResult`](/api/@graphorin/cli/interfaces/StorageBackupResult.md)\&gt;

## Stable
