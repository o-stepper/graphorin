[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / classifyModelTier

# Function: classifyModelTier()

```ts
function classifyModelTier(provider): 
  | ModelHint
  | undefined;
```

Defined in: packages/provider/src/model-tier/classify.ts:87

**`Stable`**

Classify a `Provider`'s `modelId` into one of `'fast' | 'balanced' |
'smart'`. Returns `undefined` when the model id matches none of the
canonical 2026 mappings (Ollama / OpenAI-compatible / unknown).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`ProviderLike`](/api/@graphorin/core/interfaces/ProviderLike.md) |

## Returns

  \| [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md)
  \| `undefined`
