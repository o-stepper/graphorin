[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / CrossEncoderPipeline

# Type Alias: CrossEncoderPipeline

```ts
type CrossEncoderPipeline = (pairs, options?) => Promise<
  | ReadonlyArray<ClassifierResult>
| ReadonlyArray<ReadonlyArray<ClassifierResult>>>;
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:39

**`Internal`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `pairs` | `ReadonlyArray`\<\{ `text`: `string`; `text_pair`: `string`; \}\> |
| `options?` | \{ `signal?`: `AbortSignal`; `topk?`: `number`; \} |
| `options.signal?` | `AbortSignal` |
| `options.topk?` | `number` |

## Returns

`Promise`\<
  \| `ReadonlyArray`\<[`ClassifierResult`](/api/@graphorin/reranker-transformersjs/interfaces/ClassifierResult.md)\>
  \| `ReadonlyArray`\<`ReadonlyArray`\<[`ClassifierResult`](/api/@graphorin/reranker-transformersjs/interfaces/ClassifierResult.md)\>\>\>
