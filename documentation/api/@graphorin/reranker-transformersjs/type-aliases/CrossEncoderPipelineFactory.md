[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / CrossEncoderPipelineFactory

# Type Alias: CrossEncoderPipelineFactory

```ts
type CrossEncoderPipelineFactory = (task, model, options) => Promise<CrossEncoderPipeline>;
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:45

**`Internal`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `task` | `"text-classification"` |
| `model` | `string` |
| `options` | \{ `cache_dir?`: `string`; `device?`: `string`; `dtype?`: [`RerankerDtype`](/api/@graphorin/reranker-transformersjs/type-aliases/RerankerDtype.md); `revision?`: `string`; \} |
| `options.cache_dir?` | `string` |
| `options.device?` | `string` |
| `options.dtype?` | [`RerankerDtype`](/api/@graphorin/reranker-transformersjs/type-aliases/RerankerDtype.md) |
| `options.revision?` | `string` |

## Returns

`Promise`\<[`CrossEncoderPipeline`](/api/@graphorin/reranker-transformersjs/type-aliases/CrossEncoderPipeline.md)\>
