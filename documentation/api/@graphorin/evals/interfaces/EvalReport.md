[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / EvalReport

# Interface: EvalReport\&lt;I, O\&gt;

Defined in: [packages/observability/dist/eval/types.d.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L74)

Final report shape.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aborted"></a> `aborted?` | `readonly` | `boolean` | `true` when the run was cut short by an aborted signal - `results` and `summary` then cover only the cases that finished before the abort (a partial report). Absent on a normal full run. See `runEvals`. | [packages/observability/dist/eval/types.d.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L110) |
| <a id="property-results"></a> `results` | `readonly` | readonly [`EvalCaseResult`](/api/@graphorin/evals/interfaces/EvalCaseResult.md)\&lt;`I`, `O`\&gt;[] | - | [packages/observability/dist/eval/types.d.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L75) |
| <a id="property-summary"></a> `summary` | `readonly` | \{ `avgDurationMs`: `number`; `byScorer`: `Readonly`\<`Record`\&lt;`string`, \{ `avgScore`: `number` \| `null`; `failed`: `number`; `passed`: `number`; \}\&gt;\>; `failed`: `number`; `passed`: `number`; `passHatK?`: \{ `baseCases`: `number`; `k`: `number`; `value`: `number`; \}; `passRateCi?`: \{ `hi`: `number`; `lo`: `number`; \}; `total`: `number`; \} | - | [packages/observability/dist/eval/types.d.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L76) |
| `summary.avgDurationMs` | `readonly` | `number` | - | [packages/observability/dist/eval/types.d.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L80) |
| `summary.byScorer` | `readonly` | `Readonly`\<`Record`\&lt;`string`, \{ `avgScore`: `number` \| `null`; `failed`: `number`; `passed`: `number`; \}\&gt;\> | - | [packages/observability/dist/eval/types.d.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L81) |
| `summary.failed` | `readonly` | `number` | - | [packages/observability/dist/eval/types.d.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L79) |
| `summary.passed` | `readonly` | `number` | - | [packages/observability/dist/eval/types.d.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L78) |
| `summary.passHatK?` | `readonly` | \{ `baseCases`: `number`; `k`: `number`; `value`: `number`; \} | pass^k stability metric - fraction of base cases whose EVERY repeat iteration passed. Present only when the run used `iterations > 1`. | [packages/observability/dist/eval/types.d.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L99) |
| `summary.passHatK.baseCases` | `readonly` | `number` | - | [packages/observability/dist/eval/types.d.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L101) |
| `summary.passHatK.k` | `readonly` | `number` | - | [packages/observability/dist/eval/types.d.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L100) |
| `summary.passHatK.value` | `readonly` | `number` | - | [packages/observability/dist/eval/types.d.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L102) |
| `summary.passRateCi?` | `readonly` | \{ `hi`: `number`; `lo`: `number`; \} | 95% Wilson score interval on the overall pass rate (E8 / evals-05). Always present on reports produced by `runEvals`; optional so older persisted reports keep parsing. | [packages/observability/dist/eval/types.d.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L91) |
| `summary.passRateCi.hi` | `readonly` | `number` | - | [packages/observability/dist/eval/types.d.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L93) |
| `summary.passRateCi.lo` | `readonly` | `number` | - | [packages/observability/dist/eval/types.d.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L92) |
| `summary.total` | `readonly` | `number` | - | [packages/observability/dist/eval/types.d.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L77) |
