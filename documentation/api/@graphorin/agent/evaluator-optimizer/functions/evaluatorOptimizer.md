[**Graphorin API reference v0.11.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [evaluator-optimizer](/api/@graphorin/agent/evaluator-optimizer/index.md) / evaluatorOptimizer

# Function: evaluatorOptimizer()

```ts
function evaluatorOptimizer<TOutput>(input, options): Promise<EvaluatorOptimizerOutcome<TOutput>>;
```

Defined in: [packages/agent/src/evaluator-optimizer/index.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L110)

Run the Generator → Evaluator iteration loop.

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |
| `options` | [`EvaluatorOptimizerOptions`](/api/@graphorin/agent/evaluator-optimizer/interfaces/EvaluatorOptimizerOptions.md)\&lt;`TOutput`\&gt; |

## Returns

`Promise`\<[`EvaluatorOptimizerOutcome`](/api/@graphorin/agent/evaluator-optimizer/interfaces/EvaluatorOptimizerOutcome.md)\&lt;`TOutput`\&gt;\>

## Stable
