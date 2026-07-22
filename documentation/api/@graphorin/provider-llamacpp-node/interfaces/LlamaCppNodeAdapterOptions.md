[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / LlamaCppNodeAdapterOptions

# Interface: LlamaCppNodeAdapterOptions

Defined in: src/adapter.ts:49

**`Stable`**

Options accepted by [llamaCppNodeAdapter](/api/@graphorin/provider-llamacpp-node/functions/llamaCppNodeAdapter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Sensitivity override (defaults to the loopback envelope). | src/adapter.ts:61 |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | Capability declaration. Merged on top of the defaults table. | src/adapter.ts:59 |
| <a id="property-contextsize"></a> `contextSize?` | `readonly` | `number` | Optional context-window override. | src/adapter.ts:55 |
| <a id="property-gpulayers"></a> `gpuLayers?` | `readonly` | `number` \| `"auto"` | Number of layers to offload to the GPU. Default `'auto'`. | src/adapter.ts:53 |
| <a id="property-modeloverride"></a> `modelOverride?` | `readonly` | [`LlamaModelInstance`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaModelInstance.md) | Optional `model` override that short-circuits the `loadLlamaModule(...).loadModel(...)` flow. Tests pass a fixture shaped instance. | src/adapter.ts:72 |
| <a id="property-modelpath"></a> `modelPath` | `readonly` | `string` | Filesystem path to the `.gguf` model file. | src/adapter.ts:51 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Provider name attached to spans / log lines. | src/adapter.ts:57 |
| <a id="property-persistentsession"></a> `persistentSession?` | `readonly` | `boolean` | Reuse ONE session (context + KV cache) across requests instead of creating and disposing a fresh one per call - an agent loop then avoids re-prefilling the growing transcript on every step. Requests serialise through a promise mutex (a llama context sequence is single-threaded), and the chat history re-syncs via `setChatHistory` before each prompt. Strictly opt-in: the default per-request lifecycle stays memory-safe and concurrency-safe; the cached session also skips per-request disposal (it lives until the process / instance is released). Sessions WITHOUT `setChatHistory` cannot re-sync and silently degrade to per-request behaviour. | src/adapter.ts:97 |
| <a id="property-runtimeoverrides"></a> `runtimeOverrides?` | `readonly` | [`LlamaCppNodeRuntimeOverrides`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaCppNodeRuntimeOverrides.md) | Test-only runtime override. When unset the adapter loads `node-llama-cpp` lazily on first call. | src/adapter.ts:66 |
| <a id="property-sessionfactory"></a> `sessionFactory?` | `readonly` | (`model`, `system?`) => `Promise`\&lt;[`LlamaSessionInstance`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaSessionInstance.md)\&gt; | Optional session factory override. When unset, the adapter builds a real session from the peer: `model.createContext()` → `new LlamaChatSession({ contextSequence })`, streaming through `prompt(text, { onTextChunk })`. Overrides (`runtimeOverrides.createSession` or this option) keep the test seam. | src/adapter.ts:81 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Opt-in deadline in milliseconds bounding the time to the FIRST generated token (model load included - a deadline that excluded the load would never catch the headline hang). Both `stream` and `generate` route through the same streaming path, so the scope is identical for both. On expiry the stream surfaces an in-band `error` event with kind `'transient'` and a `request timed out ...` message (this adapter's errors-as-events idiom); `generate()` re-throws it as `ProviderHttpError{ status: 0 }`, the retryable shape `withRetry` / `withFallback` recognise. A caller abort via `req.signal` still surfaces as `finishReason: 'aborted'`. Unset or `0` disables (no default - in-process inference has no universal "reasonable" bound). | src/adapter.ts:113 |
