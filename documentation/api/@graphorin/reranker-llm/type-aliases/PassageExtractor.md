[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / PassageExtractor

# Type Alias: PassageExtractor\&lt;TRecord\&gt;

```ts
type PassageExtractor<TRecord> = (record) => string;
```

Defined in: [packages/reranker-llm/src/text-extraction.ts:12](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/text-extraction.ts#L12)

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

## Stable
