[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runMemoryPruneHistory

# Function: runMemoryPruneHistory()

```ts
function runMemoryPruneHistory(options): Promise<MemoryPruneHistoryResult>;
```

Defined in: [packages/cli/src/commands/memory.ts:1160](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L1160)

`graphorin memory prune-history --older-than <duration|date>` (W-066)
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

## Stable
