[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [evaluator-optimizer](/api/@graphorin/agent/evaluator-optimizer/index.md) / EvaluatorCallable

# Type Alias: EvaluatorCallable\&lt;TOutput\&gt;

```ts
type EvaluatorCallable<TOutput> = (input, candidate, rubric, iteration) => Promise<EvaluatorOutcome>;
```

Defined in: packages/agent/src/evaluator-optimizer/index.ts:59

**`Stable`**

Evaluator callable shape. Receives the original user input + the
candidate output and returns the structured outcome.

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |
| `candidate` | `TOutput` |
| `rubric` | [`Rubric`](/api/@graphorin/agent/evaluator-optimizer/type-aliases/Rubric.md) |
| `iteration` | `number` |

## Returns

`Promise`\&lt;[`EvaluatorOutcome`](/api/@graphorin/agent/evaluator-optimizer/interfaces/EvaluatorOutcome.md)\&gt;
