[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runStorageCleanupBackups

# Function: runStorageCleanupBackups()

```ts
function runStorageCleanupBackups(options?): Promise<StorageCleanupBackupsResult>;
```

Defined in: packages/cli/src/commands/storage.ts:474

Drop stale `.bak`, `.bak.<ts>`, and `.tmp.<ts>` siblings of the
configured storage path. Useful after `encrypt` / `rekey` runs that
leave intermediate copies around.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`StorageCleanupBackupsOptions`](/api/@graphorin/cli/interfaces/StorageCleanupBackupsOptions.md) |

## Returns

`Promise`\<[`StorageCleanupBackupsResult`](/api/@graphorin/cli/interfaces/StorageCleanupBackupsResult.md)\>

## Stable
