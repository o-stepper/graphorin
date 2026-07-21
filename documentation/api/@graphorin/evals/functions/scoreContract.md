[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / scoreContract

# Function: scoreContract()

```ts
function scoreContract(maxScore): string;
```

Defined in: packages/evals/src/scorers/llm/judge.ts:199

**`Stable`**

The canonical instruction `llmJudge` appends to every prompt - defines
the parseable output marker and forbids following instructions inside fences.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `maxScore` | `number` |

## Returns

`string`
