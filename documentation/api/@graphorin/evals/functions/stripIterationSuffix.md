[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / stripIterationSuffix

# Function: stripIterationSuffix()

```ts
function stripIterationSuffix(caseId): string;
```

Defined in: packages/evals/src/stats.ts:85

**`Stable`**

Strip the `-iter-N` disambiguation suffix the runner appends under
`iterations > 1`, recovering the base case id.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `caseId` | `string` |

## Returns

`string`
