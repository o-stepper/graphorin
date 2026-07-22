[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runMemoryMigrate

# Function: runMemoryMigrate()

```ts
function runMemoryMigrate(options): Promise<MemoryMigrateResult>;
```

Defined in: packages/cli/src/commands/memory.ts:160

**`Stable`**

`graphorin memory migrate` - embedder swap. Loads the operator's
`--embedders` factory module, opens the configured store, and
drives `@graphorin/memory`'s `migrateEmbedder(...)` with the
store-side pager + the PERSISTED `migration_state` cursor - so a
killed / aborted migration resumes from where it stopped on the
next invocation. `--reclaim` additionally drops retired vector
tables and compacts free pages.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryMigrateOptions`](/api/@graphorin/cli/interfaces/MemoryMigrateOptions.md) |

## Returns

`Promise`\&lt;[`MemoryMigrateResult`](/api/@graphorin/cli/interfaces/MemoryMigrateResult.md)\&gt;
