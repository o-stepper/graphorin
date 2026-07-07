[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / parseJsonl

# Function: parseJsonl()

```ts
function parseJsonl(text, mapper?): readonly Case<unknown, unknown, Readonly<Record<string, unknown>>>[];
```

Defined in: [packages/evals/src/loaders/jsonl.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/jsonl.ts#L52)

Pure parser. Exported separately so tests can exercise the line-by-
line behaviour without touching the filesystem.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `mapper?` | (`line`, `index`) => [`Case`](/api/@graphorin/evals/interfaces/Case.md)\&lt;`unknown`, `unknown`\&gt; |

## Returns

readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<`unknown`, `unknown`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>[]

## Stable
