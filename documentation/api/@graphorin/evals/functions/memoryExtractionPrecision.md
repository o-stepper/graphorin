[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / memoryExtractionPrecision

# Function: memoryExtractionPrecision()

```ts
function memoryExtractionPrecision(options?): Scorer<MemoryOperationsEvalInput, MemoryOperationsObservation>;
```

Defined in: packages/evals/src/scorers/memory/extraction.ts:81

**`Stable`**

Extraction precision: `observed points grounded in some gold point /
observed points`. The grounded set includes every gold `content`
plus `update.previous` values (a not-yet-updated old value is
*stale*, not hallucinated). Vacuously passes when memory is empty.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryPointScorerOptions`](/api/@graphorin/evals/interfaces/MemoryPointScorerOptions.md) |

## Returns

[`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;[`MemoryOperationsEvalInput`](/api/@graphorin/evals/interfaces/MemoryOperationsEvalInput.md), [`MemoryOperationsObservation`](/api/@graphorin/evals/interfaces/MemoryOperationsObservation.md)\&gt;
