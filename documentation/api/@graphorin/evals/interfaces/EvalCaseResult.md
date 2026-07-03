[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / EvalCaseResult

# Interface: EvalCaseResult\&lt;I, O\&gt;

Defined in: observability/dist/eval/types.d.ts:59

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
| <a id="property-caseid"></a> `caseId` | `readonly` | `string` | observability/dist/eval/types.d.ts:60 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | observability/dist/eval/types.d.ts:63 |
| <a id="property-input"></a> `input` | `readonly` | `I` | observability/dist/eval/types.d.ts:61 |
| <a id="property-output"></a> `output` | `readonly` | `O` | observability/dist/eval/types.d.ts:62 |
| <a id="property-scores"></a> `scores` | `readonly` | readonly \{ `result`: [`ScoreResult`](/api/@graphorin/evals/interfaces/ScoreResult.md); `scorer`: `string`; \}[] | observability/dist/eval/types.d.ts:64 |
