[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / EvalCaseResult

# Interface: EvalCaseResult\&lt;I, O\&gt;

Defined in: [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts)

**`Stable`**

Per-case result.

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-caseid"></a> `caseId` | `readonly` | `string` | [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts) |
| <a id="property-input"></a> `input` | `readonly` | `I` | [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts) |
| <a id="property-output"></a> `output` | `readonly` | `O` | [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts) |
| <a id="property-scores"></a> `scores` | `readonly` | readonly \{ `result`: [`ScoreResult`](/api/@graphorin/evals/interfaces/ScoreResult.md); `scorer`: `string`; \}[] | [packages/observability/dist/eval/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts) |
