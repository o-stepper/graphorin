[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / defaultPassageExtractor

# Function: defaultPassageExtractor()

```ts
function defaultPassageExtractor(record): string;
```

Defined in: src/text-extraction.ts:22

**`Stable`**

Walks `text → summary → value → label → id` to find the best
passage representation of a memory record.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Returns

`string`
