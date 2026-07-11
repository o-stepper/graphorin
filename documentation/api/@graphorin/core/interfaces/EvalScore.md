[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EvalScore

# Interface: EvalScore

Defined in: [packages/core/src/contracts/eval-scorer.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/eval-scorer.ts#L39)

Result of `EvalScorer.score(...)`. `value` is normalized to `[0, 1]`
by convention; raw scores can be carried in `details`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-details"></a> `details?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/core/src/contracts/eval-scorer.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/eval-scorer.ts#L43) |
| <a id="property-pass"></a> `pass?` | `readonly` | `boolean` | [packages/core/src/contracts/eval-scorer.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/eval-scorer.ts#L41) |
| <a id="property-rationale"></a> `rationale?` | `readonly` | `string` | [packages/core/src/contracts/eval-scorer.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/eval-scorer.ts#L42) |
| <a id="property-value"></a> `value` | `readonly` | `number` | [packages/core/src/contracts/eval-scorer.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/eval-scorer.ts#L40) |
