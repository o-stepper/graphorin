[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / defaultPassageExtractor

# Function: defaultPassageExtractor()

```ts
function defaultPassageExtractor(record): string;
```

Defined in: text-extraction.ts:22

Walks `text → summary → value → label → id` to find the best
passage representation of a memory record.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Returns

`string`

## Stable
