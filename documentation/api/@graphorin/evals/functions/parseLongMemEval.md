[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / parseLongMemEval

# Function: parseLongMemEval()

```ts
function parseLongMemEval(text, abilities?): readonly Case<MemoryEvalInput, string, Readonly<Record<string, unknown>>>[];
```

Defined in: packages/evals/src/loaders/longmemeval.ts:83

**`Stable`**

Pure parser. Exported so tests can exercise the mapping without
touching the filesystem.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `abilities?` | readonly [`MemoryEvalAbility`](/api/@graphorin/evals/type-aliases/MemoryEvalAbility.md)[] |

## Returns

readonly [`Case`](/api/@graphorin/evals/interfaces/Case.md)\<[`MemoryEvalInput`](/api/@graphorin/evals/interfaces/MemoryEvalInput.md), `string`, `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>\>[]
