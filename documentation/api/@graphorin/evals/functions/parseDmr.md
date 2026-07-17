[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / parseDmr

# Function: parseDmr()

```ts
function parseDmr(text): readonly Case<MemoryEvalInput, string, Readonly<Record<string, unknown>>>[];
```

Defined in: [packages/evals/src/loaders/dmr.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/dmr.ts#L74)

Pure parser. Exported so tests can exercise the mapping without
touching the filesystem.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<[`MemoryEvalInput`](/api/@graphorin/evals/interfaces/MemoryEvalInput.md), `string`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>[]

## Stable
