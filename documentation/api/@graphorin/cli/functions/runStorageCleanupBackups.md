[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runStorageCleanupBackups

# Function: runStorageCleanupBackups()

```ts
function runStorageCleanupBackups(options?): Promise<StorageCleanupBackupsResult>;
```

Defined in: [packages/cli/src/commands/storage.ts:479](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L479)

Drop stale `.bak`, `.bak.<ts>`, and `.tmp.<ts>` siblings of the
configured storage path. Useful after `encrypt` / `rekey` runs that
leave intermediate copies around.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`StorageCleanupBackupsOptions`](/api/@graphorin/cli/interfaces/StorageCleanupBackupsOptions.md) |

## Returns

`Promise`\&lt;[`StorageCleanupBackupsResult`](/api/@graphorin/cli/interfaces/StorageCleanupBackupsResult.md)\&gt;

## Stable
