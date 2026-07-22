[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / LlamaCppNodeRuntimeOverrides

# Interface: LlamaCppNodeRuntimeOverrides

Defined in: src/runtime.ts:81

**`Stable`**

Test-only shape for injecting fixture-driven runtime behaviour.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-createsession"></a> `createSession?` | `readonly` | (`model`, `system?`) => `Promise`\&lt;[`LlamaSessionInstance`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaSessionInstance.md)\&gt; | Build a streaming chat session against an already-loaded model instance. Used by the adapter to wire `model.tokenize` and `session.promptStreamingResponse` to the per-test fixture. | src/runtime.ts:89 |
| <a id="property-getllama"></a> `getLlama?` | `readonly` | () => `Promise`\&lt;[`LlamaInstance`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaInstance.md)\&gt; | Returns a `LlamaInstance` (the result of `getLlama()`). | src/runtime.ts:83 |
| <a id="property-llamachatsession"></a> `LlamaChatSession?` | `readonly` | [`LlamaChatSessionCtor`](/api/@graphorin/provider-llamacpp-node/type-aliases/LlamaChatSessionCtor.md) | Override the `LlamaChatSession` constructor used by the REAL default session factory. Tests stub it; production loads it from the `node-llama-cpp` peer. | src/runtime.ts:98 |
