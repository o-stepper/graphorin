[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / EvalReport

# Interface: EvalReport\&lt;I, O\&gt;

Defined in: observability/dist/eval/types.d.ts:74

Final report shape.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-results"></a> `results` | `readonly` | readonly [`EvalCaseResult`](/api/@graphorin/evals/interfaces/EvalCaseResult.md)\&lt;`I`, `O`\&gt;[] | observability/dist/eval/types.d.ts:75 |
| <a id="property-summary"></a> `summary` | `readonly` | \{ `avgDurationMs`: `number`; `byScorer`: `Readonly`\<`Record`\&lt;`string`, \{ `avgScore`: `number` \| `null`; `failed`: `number`; `passed`: `number`; \}\&gt;\>; `failed`: `number`; `passed`: `number`; `total`: `number`; \} | observability/dist/eval/types.d.ts:76 |
| `summary.avgDurationMs` | `readonly` | `number` | observability/dist/eval/types.d.ts:80 |
| `summary.byScorer` | `readonly` | `Readonly`\<`Record`\&lt;`string`, \{ `avgScore`: `number` \| `null`; `failed`: `number`; `passed`: `number`; \}\&gt;\> | observability/dist/eval/types.d.ts:81 |
| `summary.failed` | `readonly` | `number` | observability/dist/eval/types.d.ts:79 |
| `summary.passed` | `readonly` | `number` | observability/dist/eval/types.d.ts:78 |
| `summary.total` | `readonly` | `number` | observability/dist/eval/types.d.ts:77 |
