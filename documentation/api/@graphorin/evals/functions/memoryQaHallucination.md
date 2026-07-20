[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / memoryQaHallucination

# Function: memoryQaHallucination()

```ts
function memoryQaHallucination(options): Scorer<MemoryOperationsEvalInput, MemoryOperationsObservation>;
```

Defined in: packages/evals/src/scorers/memory/qa.ts:41

**`Stable`**

Build the QA hallucination judge. Score `maxScore` = fully grounded
(or a correct abstention); score `0` = fabricated memory content.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryQaHallucinationOptions`](/api/@graphorin/evals/interfaces/MemoryQaHallucinationOptions.md) |

## Returns

[`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;[`MemoryOperationsEvalInput`](/api/@graphorin/evals/interfaces/MemoryOperationsEvalInput.md), [`MemoryOperationsObservation`](/api/@graphorin/evals/interfaces/MemoryOperationsObservation.md)\&gt;
