[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / executeCompaction

# Function: executeCompaction()

```ts
function executeCompaction(input): Promise<CompactionResult>;
```

Defined in: packages/memory/src/context-engine/compaction/compactor.ts:142

**`Stable`**

Perform a compaction call. Returns the result envelope containing
the produced summary, the dropped/preserved message slices, and
the per-event metadata. Phase 12 / `agent.compact()` is the
lifecycle owner; this function is the trim primitive.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ExecuteCompactionInput`](/api/@graphorin/memory/interfaces/ExecuteCompactionInput.md) |

## Returns

`Promise`\&lt;[`CompactionResult`](/api/@graphorin/memory/interfaces/CompactionResult.md)\&gt;
