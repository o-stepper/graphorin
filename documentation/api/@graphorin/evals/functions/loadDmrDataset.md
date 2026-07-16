[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / loadDmrDataset

# Function: loadDmrDataset()

```ts
function loadDmrDataset(options): Promise<Dataset<MemoryEvalInput, string, Readonly<Record<string, unknown>>>>;
```

Defined in: [packages/evals/src/loaders/dmr.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/dmr.ts#L53)

Read a DMR JSON file and return a fully-materialised [Dataset](/api/@graphorin/evals/interfaces/Dataset.md)
of multi-session retrieval cases scored against the reference answer.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LoadDmrOptions`](/api/@graphorin/evals/interfaces/LoadDmrOptions.md) |

## Returns

`Promise`\<[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\<[`MemoryEvalInput`](/api/@graphorin/evals/interfaces/MemoryEvalInput.md), `string`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>\>

## Stable
