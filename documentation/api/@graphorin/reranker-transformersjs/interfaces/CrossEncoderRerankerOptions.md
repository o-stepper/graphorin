[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / CrossEncoderRerankerOptions

# Interface: CrossEncoderRerankerOptions\&lt;TRecord\&gt;

Defined in: packages/reranker-transformersjs/src/reranker.ts:34

**`Stable`**

Options accepted by [createCrossEncoderReranker](/api/@graphorin/reranker-transformersjs/functions/createCrossEncoderReranker.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchsize"></a> `batchSize?` | `readonly` | `number` | Maximum batch size sent to the cross-encoder per inference call. Default `32`. Larger batches improve throughput at the cost of resident memory. | packages/reranker-transformersjs/src/reranker.ts:52 |
| <a id="property-cachedir"></a> `cacheDir?` | `readonly` | `string` | Optional cache directory. Honours `GRAPHORIN_CACHE_DIR` when unset. | packages/reranker-transformersjs/src/reranker.ts:44 |
| <a id="property-device"></a> `device?` | `readonly` | `string` | Override device (`'cpu'`, `'webgpu'`, …). Default `'cpu'`. | packages/reranker-transformersjs/src/reranker.ts:46 |
| <a id="property-dtype"></a> `dtype?` | `readonly` | [`RerankerDtype`](/api/@graphorin/reranker-transformersjs/type-aliases/RerankerDtype.md) | Default: `'q8'` on CPU, `'fp16'` on non-CPU devices. | packages/reranker-transformersjs/src/reranker.ts:40 |
| <a id="property-idleevictionms"></a> `idleEvictionMs?` | `readonly` | `number` | Optional idle-eviction timeout in milliseconds. When the reranker does not score a pair within this window, the loaded pipeline is dropped so the OS can reclaim the underlying ONNX session. Default `undefined` (eviction disabled). | packages/reranker-transformersjs/src/reranker.ts:59 |
| <a id="property-locale"></a> `locale?` | `readonly` | `string` | BCP 47 locale tag used to select the default model. Default `'en'`. | packages/reranker-transformersjs/src/reranker.ts:38 |
| <a id="property-model"></a> `model?` | `readonly` | `string` | Override the auto-picked model. Default: derived from `locale`. | packages/reranker-transformersjs/src/reranker.ts:36 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | **`Internal`** Override the wall-clock provider. Used by tests so the idle-eviction timer can be exercised deterministically. | packages/reranker-transformersjs/src/reranker.ts:78 |
| <a id="property-passageextractor"></a> `passageExtractor?` | `readonly` | [`PassageExtractor`](/api/@graphorin/reranker-transformersjs/type-aliases/PassageExtractor.md)\&lt;`TRecord`\&gt; | Optional passage extractor - replaces the default heuristic that walks `text → summary → value → label → id`. Useful when a custom `MemoryRecord` schema attaches the canonical text elsewhere. | packages/reranker-transformersjs/src/reranker.ts:65 |
| <a id="property-pipelinefactory"></a> `pipelineFactory?` | `readonly` | [`CrossEncoderPipelineFactory`](/api/@graphorin/reranker-transformersjs/type-aliases/CrossEncoderPipelineFactory.md) | Inject a `pipelineFactory`. Used by tests to stub the underlying `@huggingface/transformers` pipeline. Production callers leave this unset so the package lazily loads the peer. | packages/reranker-transformersjs/src/reranker.ts:71 |
| <a id="property-revision"></a> `revision?` | `readonly` | `string` | Optional revision pin (`'main'` if unset). | packages/reranker-transformersjs/src/reranker.ts:42 |
