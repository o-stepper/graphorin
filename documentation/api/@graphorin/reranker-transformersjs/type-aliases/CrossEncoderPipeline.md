[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / CrossEncoderPipeline

# Type Alias: CrossEncoderPipeline

```ts
type CrossEncoderPipeline = (pairs, options?) => Promise<
  | ReadonlyArray<ClassifierResult>
| ReadonlyArray<ReadonlyArray<ClassifierResult>>>;
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:55

**`Internal`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `pairs` | `ReadonlyArray`\&lt;\{ `text`: `string`; `text_pair`: `string`; \}\&gt; |
| `options?` | \{ `signal?`: `AbortSignal`; `topk?`: `number`; \} |
| `options.signal?` | `AbortSignal` |
| `options.topk?` | `number` |

## Returns

`Promise`\<
  \| `ReadonlyArray`\&lt;[`ClassifierResult`](/api/@graphorin/reranker-transformersjs/interfaces/ClassifierResult.md)\&gt;
  \| `ReadonlyArray`\<`ReadonlyArray`\&lt;[`ClassifierResult`](/api/@graphorin/reranker-transformersjs/interfaces/ClassifierResult.md)\&gt;\>\>
