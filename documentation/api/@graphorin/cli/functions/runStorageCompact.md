[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runStorageCompact

# Function: runStorageCompact()

```ts
function runStorageCompact(options?): Promise<StorageCompactResult>;
```

Defined in: packages/cli/src/commands/storage.ts:241

**`Stable`**

`graphorin storage compact` - return pruned pages to the OS.
`VACUUM` stays forbidden (it renumbers implicit rowids and corrupts
the FTS5 external-content mappings), but `PRAGMA incremental_vacuum`
relocates free pages via the ptrmap WITHOUT rebuilding tables, so it
is rowid-safe. Requires `auto_vacuum=2`, which `openConnection` sets
on every database it CREATES from this version on; on an older
database the command reports the limitation honestly (exit 0, file
untouched) - the only way out is recreating the store (fresh init +
`migrate-export` / import, or re-remember), because switching
auto_vacuum on retroactively needs the very VACUUM that is banned.
The vacuum runs in batches so a huge freelist never holds the writer
lock in one long bite; the WAL is checkpoint-TRUNCATEd first so
freed pages do not linger in the -wal file.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`StorageCompactOptions`](/api/@graphorin/cli/interfaces/StorageCompactOptions.md) |

## Returns

`Promise`\&lt;[`StorageCompactResult`](/api/@graphorin/cli/interfaces/StorageCompactResult.md)\&gt;
