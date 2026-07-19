[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / CrossEncoderPipelineFactory

# Type Alias: CrossEncoderPipelineFactory

```ts
type CrossEncoderPipelineFactory = (task, model, options) => Promise<CrossEncoderPipeline>;
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:69

**`Internal`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `task` | `"text-classification"` |
| `model` | `string` |
| `options` | [`CrossEncoderLoadOptions`](/api/@graphorin/reranker-transformersjs/interfaces/CrossEncoderLoadOptions.md) |

## Returns

`Promise`\&lt;[`CrossEncoderPipeline`](/api/@graphorin/reranker-transformersjs/type-aliases/CrossEncoderPipeline.md)\&gt;
