[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ScoreResult

# Interface: ScoreResult

Defined in: packages/observability/src/eval/types.ts:38

Output of [Scorer.score](/api/@graphorin/observability/interfaces/Scorer.md#score).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | packages/observability/src/eval/types.ts:43 |
| <a id="property-pass"></a> `pass` | `readonly` | `boolean` | - | packages/observability/src/eval/types.ts:39 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | packages/observability/src/eval/types.ts:42 |
| <a id="property-score"></a> `score?` | `readonly` | `number` | Optional normalized score in `[0, 1]`. | packages/observability/src/eval/types.ts:41 |
