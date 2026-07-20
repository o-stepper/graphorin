[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / memoryUpdateOmission

# Function: memoryUpdateOmission()

```ts
function memoryUpdateOmission(options?): Scorer<MemoryOperationsEvalInput, MemoryOperationsObservation>;
```

Defined in: packages/evals/src/scorers/memory/update.ts:49

**`Stable`**

Build the update-omission scorer. Vacuously passes (score `1`,
omission `0`) when the case carries no `update` / `delete` points.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryUpdateOmissionOptions`](/api/@graphorin/evals/interfaces/MemoryUpdateOmissionOptions.md) |

## Returns

[`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;[`MemoryOperationsEvalInput`](/api/@graphorin/evals/interfaces/MemoryOperationsEvalInput.md), [`MemoryOperationsObservation`](/api/@graphorin/evals/interfaces/MemoryOperationsObservation.md)\&gt;
