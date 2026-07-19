[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / PassageExtractor

# Type Alias: PassageExtractor\&lt;TRecord\&gt;

```ts
type PassageExtractor<TRecord> = (record) => string;
```

Defined in: src/text-extraction.ts:12

**`Stable`**

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | `TRecord` |

## Returns

`string`
