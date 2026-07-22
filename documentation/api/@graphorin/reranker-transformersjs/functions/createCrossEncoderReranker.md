[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / createCrossEncoderReranker

# Function: createCrossEncoderReranker()

```ts
function createCrossEncoderReranker<TRecord>(options?): TransformersJsReRanker<TRecord>;
```

Defined in: packages/reranker-transformersjs/src/reranker.ts:91

**`Stable`**

Build a cross-encoder reranker. Lazy: the pipeline is constructed on
the first `rerank()` call so packaging the reranker pays no
model-load cost.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CrossEncoderRerankerOptions`](/api/@graphorin/reranker-transformersjs/interfaces/CrossEncoderRerankerOptions.md)\&lt;`TRecord`\&gt; |

## Returns

[`TransformersJsReRanker`](/api/@graphorin/reranker-transformersjs/classes/TransformersJsReRanker.md)\&lt;`TRecord`\&gt;
