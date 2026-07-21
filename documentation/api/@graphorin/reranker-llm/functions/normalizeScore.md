[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / normalizeScore

# Function: normalizeScore()

```ts
function normalizeScore(
   raw, 
   maxScore, 
   fallback): number;
```

Defined in: src/reranker.ts:341

**`Stable`**

Normalise a raw integer score into `[0, 1]`. Rejects out-of-range
inputs by clamping; returns the configured fallback when the input
is `null` (parse failed upstream).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `number` \| `null` \| `undefined` |
| `maxScore` | `number` |
| `fallback` | `number` |

## Returns

`number`
