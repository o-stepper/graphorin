[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runMemoryPruneHistory

# Function: runMemoryPruneHistory()

```ts
function runMemoryPruneHistory(options): Promise<MemoryPruneHistoryResult>;
```

Defined in: packages/cli/src/commands/memory.ts:1160

**`Stable`**

`graphorin memory prune-history --older-than <duration|date>`
- the supported surface over `MemoryStoreExt.pruneHistory`.
`memory_history` grows by design (every supersede / quarantine
transition appends) and `purge()` already scrubs sensitive text;
this is the storage-cost hygiene lever.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryPruneHistoryOptions`](/api/@graphorin/cli/interfaces/MemoryPruneHistoryOptions.md) |

## Returns

`Promise`\&lt;[`MemoryPruneHistoryResult`](/api/@graphorin/cli/interfaces/MemoryPruneHistoryResult.md)\&gt;
