[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / fuseRrf

# Function: fuseRrf()

```ts
function fuseRrf<TRecord>(
   lists, 
   k, 
   labels?): readonly MemoryHit<TRecord>[];
```

Defined in: packages/memory/src/search/rrf.ts:119

**`Stable`**

Pure functional core of the RRF reranker - the equal-weight case of
[fuseWeighted](/api/@graphorin/memory/functions/fuseWeighted.md). Exported separately so the test suite (and the
property-based fuzzer) can exercise the math without the `Promise<…>`
wrapping of the public surface.

## Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `lists` | readonly readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[][] |
| `k` | `number` |
| `labels?` | readonly `string`[] |

## Returns

readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[]
