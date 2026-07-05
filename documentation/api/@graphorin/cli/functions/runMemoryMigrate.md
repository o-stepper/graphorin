[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runMemoryMigrate

# Function: runMemoryMigrate()

```ts
function runMemoryMigrate(options): Promise<never>;
```

Defined in: packages/cli/src/commands/memory.ts:134

`graphorin memory migrate` - embedder swap. The migration logic lives
in `@graphorin/memory`'s `migrateEmbedder(...)`; the CLI prints a
pointer when the operator did not supply the embedder factory module
(the framework cannot guess the operator's embedder configuration).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryMigrateOptions`](/api/@graphorin/cli/interfaces/MemoryMigrateOptions.md) |

## Returns

`Promise`\&lt;`never`\&gt;

## Stable
