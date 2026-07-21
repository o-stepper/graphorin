[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-transformersjs](/api/@graphorin/embedder-transformersjs/index.md) / [](/api/@graphorin/embedder-transformersjs/README.md) / PipelineFactory

# Type Alias: PipelineFactory

```ts
type PipelineFactory = (task, model, opts) => Promise<FeatureExtractor>;
```

Defined in: packages/embedder-transformersjs/src/index.ts:100

**`Internal`**

Pipeline-factory shape used for dependency injection in tests.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `task` | `"feature-extraction"` |
| `model` | `string` |
| `opts` | \{ `cache_dir?`: `string`; `device?`: `string`; `dtype?`: `string`; `revision?`: `string`; \} |
| `opts.cache_dir?` | `string` |
| `opts.device?` | `string` |
| `opts.dtype?` | `string` |
| `opts.revision?` | `string` |

## Returns

`Promise`\&lt;[`FeatureExtractor`](/api/@graphorin/embedder-transformersjs/type-aliases/FeatureExtractor.md)\&gt;
