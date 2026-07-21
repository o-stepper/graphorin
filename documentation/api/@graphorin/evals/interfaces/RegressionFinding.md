[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionFinding

# Interface: RegressionFinding

Defined in: packages/evals/src/types.ts:151

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-delta"></a> `delta` | `readonly` | `number` | - | packages/evals/src/types.ts:155 |
| <a id="property-kind"></a> `kind` | `readonly` | \| `"pass-rate-drop"` \| `"avg-score-drop"` \| `"avg-duration-increase"` \| `"scorer-removed"` | - | packages/evals/src/types.ts:152 |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | packages/evals/src/types.ts:154 |
| <a id="property-pvalue"></a> `pValue?` | `readonly` | `number` | Two-sided McNemar p-value over the cases shared by both reports (E8; only on `pass-rate-drop` findings, and only when both reports carry per-case results to pair on). | packages/evals/src/types.ts:161 |
| <a id="property-scorer"></a> `scorer?` | `readonly` | `string` | - | packages/evals/src/types.ts:153 |
