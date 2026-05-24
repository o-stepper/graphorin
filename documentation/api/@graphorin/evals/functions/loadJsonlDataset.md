[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / loadJsonlDataset

# Function: loadJsonlDataset()

```ts
function loadJsonlDataset(path, options?): Promise<Dataset<unknown, unknown, Readonly<Record<string, unknown>>>>;
```

Defined in: evals/src/loaders/jsonl.ts:32

Read a JSONL file and return a fully-materialised [Dataset](/api/@graphorin/evals/interfaces/Dataset.md).
Empty lines are skipped; malformed lines throw with the line
number.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `options` | [`LoadJsonlOptions`](/api/@graphorin/evals/interfaces/LoadJsonlOptions.md) |

## Returns

`Promise`\<[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\<`unknown`, `unknown`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>\>

## Stable
