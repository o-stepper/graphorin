[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionReport

# Interface: RegressionReport\&lt;I, O\&gt;

Defined in: [packages/evals/src/types.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L135)

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
| <a id="property-baseline"></a> `baseline` | `readonly` | [`EvalReport`](/api/@graphorin/evals/interfaces/EvalReport.md)\&lt;`I`, `O`\&gt; | [packages/evals/src/types.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L139) |
| <a id="property-current"></a> `current` | `readonly` | [`EvalReport`](/api/@graphorin/evals/interfaces/EvalReport.md)\&lt;`I`, `O`\&gt; | [packages/evals/src/types.ts:138](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L138) |
| <a id="property-findings"></a> `findings` | `readonly` | readonly [`RegressionFinding`](/api/@graphorin/evals/interfaces/RegressionFinding.md)[] | [packages/evals/src/types.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L137) |
| <a id="property-hasregressions"></a> `hasRegressions` | `readonly` | `boolean` | [packages/evals/src/types.ts:136](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L136) |
