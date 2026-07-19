[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / defaultPassageExtractor

# Function: defaultPassageExtractor()

```ts
function defaultPassageExtractor(record): string;
```

Defined in: packages/reranker-transformersjs/src/text-extraction.ts:27

**`Stable`**

Returns the best-effort passage text for a [MemoryRecord](/api/@graphorin/core/interfaces/MemoryRecord.md). The
order of preference, top-down:

  1. `text` - facts, rules, generic text-bearing tiers.
  2. `summary` - episodes.
  3. `value` - working-memory blocks.
  4. `id` fallback so the reranker never sees an empty passage.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Returns

`string`
