[**Graphorin API reference v0.5.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/openai-compatible](/api/@graphorin/provider/adapters/openai-compatible/index.md) / openAICompatibleAdapter

# Function: openAICompatibleAdapter()

```ts
function openAICompatibleAdapter(options): Provider;
```

Defined in: packages/provider/src/adapters/openai-compatible.ts:61

Build a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md) backed by an OpenAI-compatible
HTTP server. The same code path serves LMStudio, LocalAI, vLLM, and
any other compatible self-host endpoint.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`OpenAICompatibleAdapterOptions`](/api/@graphorin/provider/adapters/openai-compatible/interfaces/OpenAICompatibleAdapterOptions.md) |

## Returns

[`Provider`](/api/@graphorin/core/interfaces/Provider.md)

## Stable
