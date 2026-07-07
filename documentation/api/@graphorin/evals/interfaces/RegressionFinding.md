[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionFinding

# Interface: RegressionFinding

Defined in: [packages/evals/src/types.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L124)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-delta"></a> `delta` | `readonly` | `number` | - | [packages/evals/src/types.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L128) |
| <a id="property-kind"></a> `kind` | `readonly` | \| `"pass-rate-drop"` \| `"avg-score-drop"` \| `"avg-duration-increase"` \| `"scorer-removed"` | - | [packages/evals/src/types.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L125) |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | [packages/evals/src/types.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L127) |
| <a id="property-pvalue"></a> `pValue?` | `readonly` | `number` | Two-sided McNemar p-value over the cases shared by both reports (E8; only on `pass-rate-drop` findings, and only when both reports carry per-case results to pair on). | [packages/evals/src/types.ts:134](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L134) |
| <a id="property-scorer"></a> `scorer?` | `readonly` | `string` | - | [packages/evals/src/types.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L126) |
