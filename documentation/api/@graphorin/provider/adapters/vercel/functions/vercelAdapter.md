[**Graphorin API reference v0.13.9**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/vercel](/api/@graphorin/provider/adapters/vercel/index.md) / vercelAdapter

# Function: vercelAdapter()

```ts
function vercelAdapter(model, options?): Provider;
```

Defined in: packages/provider/src/adapters/vercel.ts:189

**`Stable`**

Wrap a Vercel AI SDK language-model value in a Graphorin
[Provider](/api/@graphorin/core/interfaces/Provider.md). Outbound requests are converted onto the AI SDK
call contract (name-keyed tools, `tool-call` / `tool-result` content
parts - see `vercel-messages.ts`); the streaming chunks emitted by
the AI SDK are translated back onto Graphorin `ProviderEvent`s.

The adapter auto-detects the model's
`ReasoningContract` from its
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
