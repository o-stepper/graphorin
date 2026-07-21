[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / loadCsvDataset

# Function: loadCsvDataset()

```ts
function loadCsvDataset(path, options?): Promise<Dataset<unknown, unknown, Readonly<Record<string, unknown>>>>;
```

Defined in: packages/evals/src/loaders/csv.ts:28

**`Stable`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `options` | [`LoadCsvOptions`](/api/@graphorin/evals/interfaces/LoadCsvOptions.md) |

## Returns

`Promise`\<[`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\<`unknown`, `unknown`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>\>
