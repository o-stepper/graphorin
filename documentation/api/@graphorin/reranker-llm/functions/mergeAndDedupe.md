[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / mergeAndDedupe

# Function: mergeAndDedupe()

```ts
function mergeAndDedupe<TRecord>(lists): readonly MergedEntry<TRecord>[];
```

Defined in: [packages/reranker-llm/src/reranker.ts:277](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L277)

Merge per-source lists, keeping the highest initial score per record
id. Pure function; exported for the unit fixture.

## Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `lists` | readonly readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[][] |

## Returns

readonly `MergedEntry`\&lt;`TRecord`\&gt;[]

## Stable
