[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / loadLocomoDataset

# Function: loadLocomoDataset()

```ts
function loadLocomoDataset(options): Promise<Dataset<MemoryEvalInput, string, Readonly<Record<string, unknown>>>>;
```

Defined in: evals/src/loaders/locomo.ts:72

Read a LOCOMO JSON file and return a fully-materialised
[Dataset](/api/@graphorin/evals/interfaces/Dataset.md) - one case per QA pair, scored against the reference
answer string (LLM-judge "J").

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LoadLocomoOptions`](/api/@graphorin/evals/interfaces/LoadLocomoOptions.md) |

## Returns

`Promise`\<[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\<[`MemoryEvalInput`](/api/@graphorin/evals/interfaces/MemoryEvalInput.md), `string`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>\>

## Stable
