[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [evaluator-optimizer](/api/@graphorin/agent/evaluator-optimizer/index.md) / EvaluatorOptimizerOutcome

# Interface: EvaluatorOptimizerOutcome\&lt;TOutput\&gt;

Defined in: packages/agent/src/evaluator-optimizer/index.ts:91

**`Stable`**

Aggregate outcome of an `evaluatorOptimizer({...})` run.

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-finalscore"></a> `finalScore` | `readonly` | `number` | packages/agent/src/evaluator-optimizer/index.ts:102 |
| <a id="property-iterations"></a> `iterations` | `readonly` | readonly \{ `candidate`: `TOutput`; `critique`: `string`; `durationMs`: `number`; `iteration`: `number`; `pass`: `boolean`; `score`: `number`; \}[] | packages/agent/src/evaluator-optimizer/index.ts:93 |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` | packages/agent/src/evaluator-optimizer/index.ts:92 |
| <a id="property-terminationreason"></a> `terminationReason` | `readonly` | `"cancelled"` \| `"pass"` \| `"maxIterations"` \| `"generator-exhausted"` | packages/agent/src/evaluator-optimizer/index.ts:101 |
