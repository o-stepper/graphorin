[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionFinding

# Interface: RegressionFinding

Defined in: evals/src/types.ts:124

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-delta"></a> `delta` | `readonly` | `number` | - | evals/src/types.ts:128 |
| <a id="property-kind"></a> `kind` | `readonly` | \| `"pass-rate-drop"` \| `"avg-score-drop"` \| `"avg-duration-increase"` \| `"scorer-removed"` | - | evals/src/types.ts:125 |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | evals/src/types.ts:127 |
| <a id="property-pvalue"></a> `pValue?` | `readonly` | `number` | Two-sided McNemar p-value over the cases shared by both reports (E8; only on `pass-rate-drop` findings, and only when both reports carry per-case results to pair on). | evals/src/types.ts:134 |
| <a id="property-scorer"></a> `scorer?` | `readonly` | `string` | - | evals/src/types.ts:126 |
