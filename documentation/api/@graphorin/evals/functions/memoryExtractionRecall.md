[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / memoryExtractionRecall

# Function: memoryExtractionRecall()

```ts
function memoryExtractionRecall(options?): Scorer<MemoryOperationsEvalInput, MemoryOperationsObservation>;
```

Defined in: packages/evals/src/scorers/memory/extraction.ts:50

**`Stable`**

Extraction recall: `matched gold extract points / gold extract
points`. Vacuously passes (score `1`) when the case carries no
`extract` points.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryPointScorerOptions`](/api/@graphorin/evals/interfaces/MemoryPointScorerOptions.md) |

## Returns

[`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;[`MemoryOperationsEvalInput`](/api/@graphorin/evals/interfaces/MemoryOperationsEvalInput.md), [`MemoryOperationsObservation`](/api/@graphorin/evals/interfaces/MemoryOperationsObservation.md)\&gt;
