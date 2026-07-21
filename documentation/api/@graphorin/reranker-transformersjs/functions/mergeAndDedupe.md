[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / mergeAndDedupe

# Function: mergeAndDedupe()

```ts
function mergeAndDedupe<TRecord>(lists): readonly MergedEntry<TRecord>[];
```

Defined in: packages/reranker-transformersjs/src/reranker.ts:305

**`Stable`**

Merge the per-source lists into a single deduplicated array,
preserving the **highest** initial score per record id and the
**first-seen order** for stable tie-breaking. Pure function;
exported for the unit test fixture.

## Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `lists` | readonly readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[][] |

## Returns

readonly [`MergedEntry`](/api/@graphorin/reranker-transformersjs/interfaces/MergedEntry.md)\&lt;`TRecord`\&gt;[]
