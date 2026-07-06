[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ScoreResult

# Interface: ScoreResult

Defined in: [packages/observability/src/eval/types.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L38)

Output of [Scorer.score](/api/@graphorin/observability/interfaces/Scorer.md#score).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | [packages/observability/src/eval/types.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L43) |
| <a id="property-pass"></a> `pass` | `readonly` | `boolean` | - | [packages/observability/src/eval/types.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L39) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | [packages/observability/src/eval/types.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L42) |
| <a id="property-score"></a> `score?` | `readonly` | `number` | Optional normalized score in `[0, 1]`. | [packages/observability/src/eval/types.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/eval/types.ts#L41) |
