[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / llamaCppNodeAdapter

# Function: llamaCppNodeAdapter()

```ts
function llamaCppNodeAdapter(options): Provider;
```

Defined in: [packages/provider-llamacpp-node/src/adapter.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/provider-llamacpp-node/src/adapter.ts#L118)

Build a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md) backed by an in-process GGUF
model. The first call lazily loads the `node-llama-cpp` peer + the
model file; subsequent calls reuse the cached instances.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LlamaCppNodeAdapterOptions`](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaCppNodeAdapterOptions.md) |

## Returns

[`Provider`](/api/@graphorin/core/interfaces/Provider.md)

## Stable
