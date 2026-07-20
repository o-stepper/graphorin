[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / PassageExtractor

# Type Alias: PassageExtractor\&lt;TRecord\&gt;

```ts
type PassageExtractor<TRecord> = (record) => string;
```

Defined in: packages/reranker-transformersjs/src/text-extraction.ts:47

**`Stable`**

Caller-supplied passage extractor. Receives the record + the
surrounding metadata (kind, sensitivity, tags) and returns the
passage to feed into the cross-encoder.

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
