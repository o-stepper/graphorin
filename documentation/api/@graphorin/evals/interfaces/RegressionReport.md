[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionReport

# Interface: RegressionReport\&lt;I, O\&gt;

Defined in: [packages/evals/src/types.ts:116](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L116)

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
| <a id="property-baseline"></a> `baseline` | `readonly` | [`EvalReport`](/api/@graphorin/evals/interfaces/EvalReport.md)\&lt;`I`, `O`\&gt; | [packages/evals/src/types.ts:120](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L120) |
| <a id="property-current"></a> `current` | `readonly` | [`EvalReport`](/api/@graphorin/evals/interfaces/EvalReport.md)\&lt;`I`, `O`\&gt; | [packages/evals/src/types.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L119) |
| <a id="property-findings"></a> `findings` | `readonly` | readonly [`RegressionFinding`](/api/@graphorin/evals/interfaces/RegressionFinding.md)[] | [packages/evals/src/types.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L118) |
| <a id="property-hasregressions"></a> `hasRegressions` | `readonly` | `boolean` | [packages/evals/src/types.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L117) |
