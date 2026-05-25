[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / normalizeScore

# Function: normalizeScore()

```ts
function normalizeScore(
   raw, 
   maxScore, 
   fallback): number;
```

Defined in: reranker.ts:309

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

## Stable
