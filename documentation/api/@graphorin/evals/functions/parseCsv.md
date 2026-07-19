[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / parseCsv

# Function: parseCsv()

```ts
function parseCsv(text, options?): readonly Case<unknown, unknown, Readonly<Record<string, unknown>>>[];
```

Defined in: packages/evals/src/loaders/csv.ts:48

**`Stable`**

Pure parser. Exported separately so tests can exercise the
column-mapping behaviour without touching the filesystem.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `options` | [`LoadCsvOptions`](/api/@graphorin/evals/interfaces/LoadCsvOptions.md) |

## Returns

readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<`unknown`, `unknown`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>[]
