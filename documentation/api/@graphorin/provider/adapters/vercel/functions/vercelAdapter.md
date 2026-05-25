[**Graphorin API reference v0.4.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/vercel](/api/@graphorin/provider/adapters/vercel/index.md) / vercelAdapter

# Function: vercelAdapter()

```ts
function vercelAdapter(model, options?): Provider;
```

Defined in: packages/provider/src/adapters/vercel.ts:169

Wrap a Vercel AI SDK language-model value in a Graphorin
[Provider](/api/@graphorin/core/interfaces/Provider.md). The adapter passes Graphorin `Message`s through
directly — both formats use the same role + content discriminated
shape — and translates the streaming chunks emitted by the AI SDK
onto Graphorin `ProviderEvent`s.

The adapter auto-detects the model's
import('@graphorin/core').ReasoningContract from its
`modelId` (e.g. Anthropic Claude → `'round-trip-required'`,
OpenAI o1 / o3 → `'hidden'`, Gemini reasoning variants →
`'hidden'`, everything else → `'optional'`). Callers can override
the inferred value via `options.capabilities.reasoningContract`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | [`LanguageModelLike`](/api/@graphorin/provider/adapters/vercel/interfaces/LanguageModelLike.md) |
| `options` | [`VercelAdapterOptions`](/api/@graphorin/provider/adapters/vercel/interfaces/VercelAdapterOptions.md) |

## Returns

[`Provider`](/api/@graphorin/core/interfaces/Provider.md)

## Stable
