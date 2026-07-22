[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / EvalCaseResult

# Interface: EvalCaseResult\&lt;I, O\&gt;

Defined in: packages/observability/src/eval/types.ts:63

**`Stable`**

Per-case result.

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-caseid"></a> `caseId` | `readonly` | `string` | - | packages/observability/src/eval/types.ts:64 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | packages/observability/src/eval/types.ts:74 |
| <a id="property-expected"></a> `expected?` | `readonly` | `O` | The dataset's reference answer for this case (`Case.expected`), echoed into the result so persisted reports can be audited without re-joining them against the dataset. Absent when the case declared no expectation. | packages/observability/src/eval/types.ts:73 |
| <a id="property-input"></a> `input` | `readonly` | `I` | - | packages/observability/src/eval/types.ts:65 |
| <a id="property-output"></a> `output` | `readonly` | `O` | - | packages/observability/src/eval/types.ts:66 |
| <a id="property-scores"></a> `scores` | `readonly` | readonly \{ `result`: [`ScoreResult`](/api/@graphorin/observability/interfaces/ScoreResult.md); `scorer`: `string`; \}[] | - | packages/observability/src/eval/types.ts:75 |
