[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / normalizeScore

# Function: normalizeScore()

```ts
function normalizeScore(
   raw, 
   maxScore, 
   fallback): number;
```

Defined in: [packages/reranker-llm/src/reranker.ts:336](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/reranker.ts#L336)

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
