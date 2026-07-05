[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / LlamaCppNodeAdapterOptions

# Interface: LlamaCppNodeAdapterOptions

Defined in: adapter.ts:47

Options accepted by [llamaCppNodeAdapter](/api/@graphorin/provider-llamacpp-node/functions/llamaCppNodeAdapter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Sensitivity override (defaults to the loopback envelope). | adapter.ts:59 |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | Capability declaration. Merged on top of the defaults table. | adapter.ts:57 |
| <a id="property-contextsize"></a> `contextSize?` | `readonly` | `number` | Optional context-window override. | adapter.ts:53 |
| <a id="property-gpulayers"></a> `gpuLayers?` | `readonly` | `number` \| `"auto"` | Number of layers to offload to the GPU. Default `'auto'`. | adapter.ts:51 |
| <a id="property-modeloverride"></a> `modelOverride?` | `readonly` | [`LlamaModelInstance`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaModelInstance.md) | Optional `model` override that short-circuits the `loadLlamaModule(...).loadModel(...)` flow. Tests pass a fixture shaped instance. | adapter.ts:70 |
| <a id="property-modelpath"></a> `modelPath` | `readonly` | `string` | Filesystem path to the `.gguf` model file. | adapter.ts:49 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Provider name attached to spans / log lines. | adapter.ts:55 |
| <a id="property-runtimeoverrides"></a> `runtimeOverrides?` | `readonly` | [`LlamaCppNodeRuntimeOverrides`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaCppNodeRuntimeOverrides.md) | Test-only runtime override. When unset the adapter loads `node-llama-cpp` lazily on first call. | adapter.ts:64 |
| <a id="property-sessionfactory"></a> `sessionFactory?` | `readonly` | (`model`, `system?`) => `Promise`\&lt;[`LlamaSessionInstance`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaSessionInstance.md)\&gt; | Optional session factory override. When unset, the adapter builds a real session from the peer (PS-3): `model.createContext()` → `new LlamaChatSession({ contextSequence })`, streaming through `prompt(text, { onTextChunk })`. Overrides (`runtimeOverrides.createSession` or this option) keep the test seam. | adapter.ts:79 |
