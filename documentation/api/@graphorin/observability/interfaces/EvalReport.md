[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / EvalReport

# Interface: EvalReport\&lt;I, O\&gt;

Defined in: packages/observability/src/eval/types.ts:76

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
| <a id="property-aborted"></a> `aborted?` | `readonly` | `boolean` | `true` when the run was cut short by an aborted signal — `results` and `summary` then cover only the cases that finished before the abort (a partial report). Absent on a normal full run. See `runEvals`. | packages/observability/src/eval/types.ts:95 |
| <a id="property-results"></a> `results` | `readonly` | readonly [`EvalCaseResult`](/api/@graphorin/observability/interfaces/EvalCaseResult.md)\&lt;`I`, `O`\&gt;[] | - | packages/observability/src/eval/types.ts:77 |
| <a id="property-summary"></a> `summary` | `readonly` | \{ `avgDurationMs`: `number`; `byScorer`: `Readonly`\<`Record`\&lt;`string`, \{ `avgScore`: `number` \| `null`; `failed`: `number`; `passed`: `number`; \}\&gt;\>; `failed`: `number`; `passed`: `number`; `total`: `number`; \} | - | packages/observability/src/eval/types.ts:78 |
| `summary.avgDurationMs` | `readonly` | `number` | - | packages/observability/src/eval/types.ts:82 |
| `summary.byScorer` | `readonly` | `Readonly`\<`Record`\&lt;`string`, \{ `avgScore`: `number` \| `null`; `failed`: `number`; `passed`: `number`; \}\&gt;\> | - | packages/observability/src/eval/types.ts:83 |
| `summary.failed` | `readonly` | `number` | - | packages/observability/src/eval/types.ts:81 |
| `summary.passed` | `readonly` | `number` | - | packages/observability/src/eval/types.ts:80 |
| `summary.total` | `readonly` | `number` | - | packages/observability/src/eval/types.ts:79 |
