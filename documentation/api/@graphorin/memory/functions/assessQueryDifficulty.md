[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / assessQueryDifficulty

# Function: assessQueryDifficulty()

```ts
function assessQueryDifficulty(query, options?): DifficultyAssessment;
```

Defined in: [packages/memory/src/search/iterative.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L118)

Score a query's retrieval difficulty with cheap, deterministic, fully
**local** heuristics (no I/O). Conservative by design - it prefers to
leave a query single-shot (`hard: false`) unless several
multi-hop / temporal / comparison signals stack up, so the gate adds
passes only where they are likely to help. Used by
[runIterativeRetrieval](/api/@graphorin/memory/functions/runIterativeRetrieval.md) to decide whether to enter the loop.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `options` | [`DifficultyGateOptions`](/api/@graphorin/memory/interfaces/DifficultyGateOptions.md) |

## Returns

[`DifficultyAssessment`](/api/@graphorin/memory/interfaces/DifficultyAssessment.md)

## Stable
