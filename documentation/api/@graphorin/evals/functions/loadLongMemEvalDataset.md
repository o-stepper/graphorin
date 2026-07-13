[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / loadLongMemEvalDataset

# Function: loadLongMemEvalDataset()

```ts
function loadLongMemEvalDataset(options): Promise<Dataset<MemoryEvalInput, string, Readonly<Record<string, unknown>>>>;
```

Defined in: [packages/evals/src/loaders/longmemeval.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/longmemeval.ts#L61)

Read a LongMemEval JSON file and return a fully-materialised
[Dataset](/api/@graphorin/evals/interfaces/Dataset.md) of [MemoryEvalInput](/api/@graphorin/evals/interfaces/MemoryEvalInput.md) cases scored against the
reference `answer` string.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LoadLongMemEvalOptions`](/api/@graphorin/evals/interfaces/LoadLongMemEvalOptions.md) |

## Returns

`Promise`\<[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\<[`MemoryEvalInput`](/api/@graphorin/evals/interfaces/MemoryEvalInput.md), `string`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>\>

## Stable
