[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / loadHaluMemDataset

# Function: loadHaluMemDataset()

```ts
function loadHaluMemDataset(options): Promise<Dataset<MemoryOperationsEvalInput, MemoryOperationsObservation, Readonly<Record<string, unknown>>>>;
```

Defined in: packages/evals/src/loaders/halumem.ts:80

**`Stable`**

Read a HaluMem-format JSON file and return a fully-materialised
[Dataset](/api/@graphorin/evals/interfaces/Dataset.md) of [MemoryOperationsEvalInput](/api/@graphorin/evals/interfaces/MemoryOperationsEvalInput.md) cases.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LoadHaluMemOptions`](/api/@graphorin/evals/interfaces/LoadHaluMemOptions.md) |

## Returns

`Promise`\<[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\<[`MemoryOperationsEvalInput`](/api/@graphorin/evals/interfaces/MemoryOperationsEvalInput.md), [`MemoryOperationsObservation`](/api/@graphorin/evals/interfaces/MemoryOperationsObservation.md), `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>\>
