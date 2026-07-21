[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / llamaCppNodeAdapter

# Function: llamaCppNodeAdapter()

```ts
function llamaCppNodeAdapter(options): Provider;
```

Defined in: src/adapter.ts:118

**`Stable`**

Build a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md) backed by an in-process GGUF
model. The first call lazily loads the `node-llama-cpp` peer + the
model file; subsequent calls reuse the cached instances.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LlamaCppNodeAdapterOptions`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaCppNodeAdapterOptions.md) |

## Returns

[`Provider`](/api/@graphorin/core/interfaces/Provider.md)
