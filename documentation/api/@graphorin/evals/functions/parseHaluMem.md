[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / parseHaluMem

# Function: parseHaluMem()

```ts
function parseHaluMem(text, stage): readonly Case<MemoryOperationsEvalInput, MemoryOperationsObservation, Readonly<Record<string, unknown>>>[];
```

Defined in: packages/evals/src/loaders/halumem.ts:101

**`Stable`**

Pure parser. Exported so tests can exercise the mapping without
touching the filesystem.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `stage` | [`HaluMemStage`](/api/@graphorin/evals/type-aliases/HaluMemStage.md) |

## Returns

readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<[`MemoryOperationsEvalInput`](/api/@graphorin/evals/interfaces/MemoryOperationsEvalInput.md), [`MemoryOperationsObservation`](/api/@graphorin/evals/interfaces/MemoryOperationsObservation.md), `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>[]
