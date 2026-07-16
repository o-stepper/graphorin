[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [evaluator-optimizer](/api/@graphorin/agent/evaluator-optimizer/index.md) / EvaluatorOptimizerOptions

# Interface: EvaluatorOptimizerOptions\&lt;TOutput\&gt;

Defined in: [packages/agent/src/evaluator-optimizer/index.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L72)

Options accepted by [evaluatorOptimizer](/api/@graphorin/agent/evaluator-optimizer/functions/evaluatorOptimizer.md). `maxIterations`
is REQUIRED - the helper asserts `>= 1` at construction time.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | [packages/agent/src/evaluator-optimizer/index.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L83) |
| <a id="property-emit"></a> `emit?` | `readonly` | (`event`) => `void` | Optional event emitter for `agent.evaluator.iteration / converged`. | [packages/agent/src/evaluator-optimizer/index.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L80) |
| <a id="property-evaluator"></a> `evaluator` | `readonly` | [`EvaluatorCallable`](/api/@graphorin/agent/evaluator-optimizer/type-aliases/EvaluatorCallable.md)\&lt;`TOutput`\&gt; | - | [packages/agent/src/evaluator-optimizer/index.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L74) |
| <a id="property-generator"></a> `generator` | `readonly` | [`GeneratorCallable`](/api/@graphorin/agent/evaluator-optimizer/type-aliases/GeneratorCallable.md)\&lt;`TOutput`\&gt; | - | [packages/agent/src/evaluator-optimizer/index.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L73) |
| <a id="property-maxiterations"></a> `maxIterations` | `readonly` | `number` | - | [packages/agent/src/evaluator-optimizer/index.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L75) |
| <a id="property-mergestrategy"></a> `mergeStrategy?` | `readonly` | `"last-iteration"` \| `"best-score"` | - | [packages/agent/src/evaluator-optimizer/index.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L77) |
| <a id="property-rubric"></a> `rubric` | `readonly` | [`Rubric`](/api/@graphorin/agent/evaluator-optimizer/type-aliases/Rubric.md) | - | [packages/agent/src/evaluator-optimizer/index.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L76) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | - | [packages/agent/src/evaluator-optimizer/index.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L81) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | [packages/agent/src/evaluator-optimizer/index.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L82) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/agent/src/evaluator-optimizer/index.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/evaluator-optimizer/index.ts#L78) |
