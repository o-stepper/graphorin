[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionFinding

# Interface: RegressionFinding

Defined in: [packages/evals/src/types.ts:143](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L143)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-delta"></a> `delta` | `readonly` | `number` | - | [packages/evals/src/types.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L147) |
| <a id="property-kind"></a> `kind` | `readonly` | \| `"pass-rate-drop"` \| `"avg-score-drop"` \| `"avg-duration-increase"` \| `"scorer-removed"` | - | [packages/evals/src/types.ts:144](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L144) |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | [packages/evals/src/types.ts:146](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L146) |
| <a id="property-pvalue"></a> `pValue?` | `readonly` | `number` | Two-sided McNemar p-value over the cases shared by both reports (E8; only on `pass-rate-drop` findings, and only when both reports carry per-case results to pair on). | [packages/evals/src/types.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L153) |
| <a id="property-scorer"></a> `scorer?` | `readonly` | `string` | - | [packages/evals/src/types.ts:145](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L145) |
