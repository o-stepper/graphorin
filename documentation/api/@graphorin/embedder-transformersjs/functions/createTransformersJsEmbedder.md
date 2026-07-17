[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-transformersjs](/api/@graphorin/embedder-transformersjs/index.md) / [](/api/@graphorin/embedder-transformersjs/README.md) / createTransformersJsEmbedder

# Function: createTransformersJsEmbedder()

```ts
function createTransformersJsEmbedder(options?): TransformersJsEmbedder;
```

Defined in: [packages/embedder-transformersjs/src/index.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/embedder-transformersjs/src/index.ts#L126)

Build a `TransformersJsEmbedder` instance. Lazy: the underlying
pipeline is constructed on the first `embed()` call so packaging
the embedder does not pay the model-load cost.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TransformersJsEmbedderOptions`](/api/@graphorin/embedder-transformersjs/interfaces/TransformersJsEmbedderOptions.md) |

## Returns

[`TransformersJsEmbedder`](/api/@graphorin/embedder-transformersjs/classes/TransformersJsEmbedder.md)

## Stable
