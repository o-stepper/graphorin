[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-transformersjs](/api/@graphorin/embedder-transformersjs/index.md) / TransformersJsEmbedderOptions

# Interface: TransformersJsEmbedderOptions

Defined in: packages/embedder-transformersjs/src/index.ts:31

Configuration accepted by [createTransformersJsEmbedder](/api/@graphorin/embedder-transformersjs/functions/createTransformersJsEmbedder.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cachedir"></a> `cacheDir?` | `readonly` | `string` | Optional cache directory. When unset, the embedder honours `process.env.GRAPHORIN_CACHE_DIR`, otherwise falls back to the Hugging Face default (`os.homedir()/.cache/huggingface/hub`). | packages/embedder-transformersjs/src/index.ts:45 |
| <a id="property-device"></a> `device?` | `readonly` | `string` | Override device (`'cpu'`, `'webgpu'`, …). Default `'cpu'`. | packages/embedder-transformersjs/src/index.ts:52 |
| <a id="property-dim"></a> `dim?` | `readonly` | `number` | Optional dimensionality hint. When the caller knows the output dimension up-front, it is included in the canonical id without waiting for the first `embed()` call. | packages/embedder-transformersjs/src/index.ts:64 |
| <a id="property-dtype"></a> `dtype?` | `readonly` | `string` | Optional dtype hint (`'fp32' | 'fp16' | 'q8' | 'q4'`). When unset, the runtime picks the model's recommended default. | packages/embedder-transformersjs/src/index.ts:50 |
| <a id="property-model"></a> `model?` | `readonly` | `string` | Default `'Xenova/multilingual-e5-base'` (768-dim). | packages/embedder-transformersjs/src/index.ts:33 |
| <a id="property-normalize"></a> `normalize?` | `readonly` | `boolean` | Default `true`. | packages/embedder-transformersjs/src/index.ts:37 |
| <a id="property-pipelinefactory"></a> `pipelineFactory?` | `readonly` | [`PipelineFactory`](/api/@graphorin/embedder-transformersjs/type-aliases/PipelineFactory.md) | Override the underlying `pipeline` factory — used by the test suite to inject a stub. Production callers should leave this unset so the package lazily loads `@huggingface/transformers`. | packages/embedder-transformersjs/src/index.ts:58 |
| <a id="property-pooling"></a> `pooling?` | `readonly` | [`Pooling`](/api/@graphorin/embedder-transformersjs/type-aliases/Pooling.md) | Default `'mean'`. | packages/embedder-transformersjs/src/index.ts:35 |
| <a id="property-revision"></a> `revision?` | `readonly` | `string` | Optional model revision pin (`'main'` if unset). | packages/embedder-transformersjs/src/index.ts:39 |
