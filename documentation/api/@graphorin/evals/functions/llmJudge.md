[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / llmJudge

# Function: llmJudge()

```ts
function llmJudge<I, O>(options): Scorer<I, O>;
```

Defined in: packages/evals/src/scorers/llm/judge.ts:49

**`Stable`**

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `I` | `unknown` |
| `O` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LlmJudgeOptions`](/api/@graphorin/evals/interfaces/LlmJudgeOptions.md)\&lt;`I`, `O`\&gt; |

## Returns

[`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;`I`, `O`\&gt;
