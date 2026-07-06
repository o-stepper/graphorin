[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / EvalCaseResult

# Interface: EvalCaseResult\&lt;I, O\&gt;

Defined in: [packages/observability/dist/eval/types.d.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L59)

Per-case result.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-caseid"></a> `caseId` | `readonly` | `string` | [packages/observability/dist/eval/types.d.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L60) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | [packages/observability/dist/eval/types.d.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L63) |
| <a id="property-input"></a> `input` | `readonly` | `I` | [packages/observability/dist/eval/types.d.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L61) |
| <a id="property-output"></a> `output` | `readonly` | `O` | [packages/observability/dist/eval/types.d.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L62) |
| <a id="property-scores"></a> `scores` | `readonly` | readonly \{ `result`: [`ScoreResult`](/api/@graphorin/evals/interfaces/ScoreResult.md); `scorer`: `string`; \}[] | [packages/observability/dist/eval/types.d.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L64) |
