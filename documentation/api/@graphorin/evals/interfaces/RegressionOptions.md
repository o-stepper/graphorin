[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionOptions

# Interface: RegressionOptions

Defined in: evals/src/types.ts:77

Regression-detection options.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxavgdurationincreasems"></a> `maxAvgDurationIncreaseMs?` | `readonly` | `number` | Maximum allowed increase in `avgDurationMs`. | evals/src/types.ts:83 |
| <a id="property-maxavgscoredrop"></a> `maxAvgScoreDrop?` | `readonly` | `number` | Minimum drop in average score per scorer that counts as a regression. | evals/src/types.ts:81 |
| <a id="property-maxpassratedroppct"></a> `maxPassRateDropPct?` | `readonly` | `number` | Minimum drop in pass-rate (in percentage points) that counts as a regression. | evals/src/types.ts:79 |
