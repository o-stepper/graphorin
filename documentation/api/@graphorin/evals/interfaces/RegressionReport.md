[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionReport

# Interface: RegressionReport\&lt;I, O\&gt;

Defined in: evals/src/types.ts:91

Result of [detectRegressions](/api/@graphorin/evals/functions/detectRegressions.md).

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-baseline"></a> `baseline` | `readonly` | [`EvalReport`](/api/@graphorin/evals/interfaces/EvalReport.md)\&lt;`I`, `O`\&gt; | evals/src/types.ts:95 |
| <a id="property-current"></a> `current` | `readonly` | [`EvalReport`](/api/@graphorin/evals/interfaces/EvalReport.md)\&lt;`I`, `O`\&gt; | evals/src/types.ts:94 |
| <a id="property-findings"></a> `findings` | `readonly` | readonly [`RegressionFinding`](/api/@graphorin/evals/interfaces/RegressionFinding.md)[] | evals/src/types.ts:93 |
| <a id="property-hasregressions"></a> `hasRegressions` | `readonly` | `boolean` | evals/src/types.ts:92 |
