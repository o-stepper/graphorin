[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / parseLocomo

# Function: parseLocomo()

```ts
function parseLocomo(text): readonly Case<MemoryEvalInput, string, Readonly<Record<string, unknown>>>[];
```

Defined in: [packages/evals/src/loaders/locomo.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/locomo.ts#L93)

Pure parser. Exported so tests can exercise the mapping without
touching the filesystem.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<[`MemoryEvalInput`](/api/@graphorin/evals/interfaces/MemoryEvalInput.md), `string`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>[]

## Stable
