[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runStorageBackup

# Function: runStorageBackup()

```ts
function runStorageBackup(options): Promise<StorageBackupResult>;
```

Defined in: packages/cli/src/commands/storage.ts:169

**`Stable`**

Backup with two honest modes, selected by the config's
`storage.encryption.enabled`:

- **Plaintext store**: online backup via the driver's page-level
  `backup()` API - consistent under a live writer (the daemon can
  keep running) and preserves rowids so FTS5 external-content
  mappings survive.
- **Encrypted store**: a consistent stopped-server byte copy
  (checkpoint, prove no live holder, copy, verify the copy's
  cipher integrity). The driver's page-level API cannot key either
  side of the transfer, so an online encrypted backup is not
  possible; a live server makes this command fail with a clear
  live-writer error instead of shipping a torn copy.

Either way this is the ONLY supported backup: `VACUUM INTO`
renumbers rowids and corrupts the FTS mapping on restore.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`StorageBackupOptions`](/api/@graphorin/cli/interfaces/StorageBackupOptions.md) |

## Returns

`Promise`\&lt;[`StorageBackupResult`](/api/@graphorin/cli/interfaces/StorageBackupResult.md)\&gt;
