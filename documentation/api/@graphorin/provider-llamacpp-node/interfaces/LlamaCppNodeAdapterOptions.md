[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / LlamaCppNodeAdapterOptions

# Interface: LlamaCppNodeAdapterOptions

Defined in: [packages/provider-llamacpp-node/src/adapter.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L48)

Options accepted by [llamaCppNodeAdapter](/api/@graphorin/provider-llamacpp-node/functions/llamaCppNodeAdapter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Sensitivity override (defaults to the loopback envelope). | [packages/provider-llamacpp-node/src/adapter.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L60) |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | Capability declaration. Merged on top of the defaults table. | [packages/provider-llamacpp-node/src/adapter.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L58) |
| <a id="property-contextsize"></a> `contextSize?` | `readonly` | `number` | Optional context-window override. | [packages/provider-llamacpp-node/src/adapter.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L54) |
| <a id="property-gpulayers"></a> `gpuLayers?` | `readonly` | `number` \| `"auto"` | Number of layers to offload to the GPU. Default `'auto'`. | [packages/provider-llamacpp-node/src/adapter.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L52) |
| <a id="property-modeloverride"></a> `modelOverride?` | `readonly` | [`LlamaModelInstance`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaModelInstance.md) | Optional `model` override that short-circuits the `loadLlamaModule(...).loadModel(...)` flow. Tests pass a fixture shaped instance. | [packages/provider-llamacpp-node/src/adapter.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L71) |
| <a id="property-modelpath"></a> `modelPath` | `readonly` | `string` | Filesystem path to the `.gguf` model file. | [packages/provider-llamacpp-node/src/adapter.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L50) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Provider name attached to spans / log lines. | [packages/provider-llamacpp-node/src/adapter.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L56) |
| <a id="property-persistentsession"></a> `persistentSession?` | `readonly` | `boolean` | W-096: reuse ONE session (context + KV cache) across requests instead of creating and disposing a fresh one per call - an agent loop then avoids re-prefilling the growing transcript on every step. Requests serialise through a promise mutex (a llama context sequence is single-threaded), and the chat history re-syncs via `setChatHistory` before each prompt. Strictly opt-in: the default per-request lifecycle stays memory-safe and concurrency-safe; the cached session also skips per-request disposal (it lives until the process / instance is released). Sessions WITHOUT `setChatHistory` cannot re-sync and silently degrade to per-request behaviour. | [packages/provider-llamacpp-node/src/adapter.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L96) |
| <a id="property-runtimeoverrides"></a> `runtimeOverrides?` | `readonly` | [`LlamaCppNodeRuntimeOverrides`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaCppNodeRuntimeOverrides.md) | Test-only runtime override. When unset the adapter loads `node-llama-cpp` lazily on first call. | [packages/provider-llamacpp-node/src/adapter.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L65) |
| <a id="property-sessionfactory"></a> `sessionFactory?` | `readonly` | (`model`, `system?`) => `Promise`\&lt;[`LlamaSessionInstance`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaSessionInstance.md)\&gt; | Optional session factory override. When unset, the adapter builds a real session from the peer (PS-3): `model.createContext()` → `new LlamaChatSession({ contextSequence })`, streaming through `prompt(text, { onTextChunk })`. Overrides (`runtimeOverrides.createSession` or this option) keep the test seam. | [packages/provider-llamacpp-node/src/adapter.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L80) |
