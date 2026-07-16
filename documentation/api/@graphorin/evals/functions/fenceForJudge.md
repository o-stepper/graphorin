[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / fenceForJudge

# Function: fenceForJudge()

```ts
function fenceForJudge(label, value): string;
```

Defined in: [packages/evals/src/scorers/llm/judge.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/llm/judge.ts#L124)

EB-7: wrap untrusted content in unambiguous sentinel fences so the judge can
tell data from instructions. Exported so caller-supplied `buildPrompt`
functions (e.g. the prebuilt scorers, the LongMemEval judge) fence the same
way the default builder does.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `label` | `string` |
| `value` | `unknown` |

## Returns

`string`

## Stable
