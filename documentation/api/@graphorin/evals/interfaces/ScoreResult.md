[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / ScoreResult

# Interface: ScoreResult

Defined in: observability/dist/eval/types.d.ts:36

Output of [Scorer.score](/api/@graphorin/evals/interfaces/Scorer.md#score).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | observability/dist/eval/types.d.ts:41 |
| <a id="property-pass"></a> `pass` | `readonly` | `boolean` | - | observability/dist/eval/types.d.ts:37 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | observability/dist/eval/types.d.ts:40 |
| <a id="property-score"></a> `score?` | `readonly` | `number` | Optional normalized score in `[0, 1]`. | observability/dist/eval/types.d.ts:39 |
