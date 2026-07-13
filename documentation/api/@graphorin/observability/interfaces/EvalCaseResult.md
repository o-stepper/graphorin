[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / EvalCaseResult

# Interface: EvalCaseResult\&lt;I, O\&gt;

Defined in: [packages/observability/src/eval/types.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L63)

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
| <a id="property-caseid"></a> `caseId` | `readonly` | `string` | [packages/observability/src/eval/types.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L64) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | [packages/observability/src/eval/types.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L67) |
| <a id="property-input"></a> `input` | `readonly` | `I` | [packages/observability/src/eval/types.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L65) |
| <a id="property-output"></a> `output` | `readonly` | `O` | [packages/observability/src/eval/types.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L66) |
| <a id="property-scores"></a> `scores` | `readonly` | readonly \{ `result`: [`ScoreResult`](/api/@graphorin/observability/interfaces/ScoreResult.md); `scorer`: `string`; \}[] | [packages/observability/src/eval/types.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L68) |
