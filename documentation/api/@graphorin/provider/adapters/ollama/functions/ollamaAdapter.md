[**Graphorin API reference v0.4.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/ollama](/api/@graphorin/provider/adapters/ollama/index.md) / ollamaAdapter

# Function: ollamaAdapter()

```ts
function ollamaAdapter(options): Provider;
```

Defined in: packages/provider/src/adapters/ollama.ts:79

Build a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md) backed by Ollama's native HTTP
API. The adapter is fail-safe by default: public-cleartext URLs
refuse to start with `LocalProviderInsecureTransportError`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`OllamaAdapterOptions`](/api/@graphorin/provider/adapters/ollama/interfaces/OllamaAdapterOptions.md) |

## Returns

[`Provider`](/api/@graphorin/core/interfaces/Provider.md)

## Stable
