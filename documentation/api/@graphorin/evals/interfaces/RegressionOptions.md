[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionOptions

# Interface: RegressionOptions

Defined in: evals/src/types.ts:84

Regression-detection options.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxavgdurationincreasems"></a> `maxAvgDurationIncreaseMs?` | `readonly` | `number` | Maximum allowed increase in `avgDurationMs` before it counts as a regression. **Opt-in: defaults to `Infinity` (gate off)** because absolute wall-clock budgets are environment-sensitive (workstation baseline vs CI runner, real LLM-latency jitter). Pass a finite ms budget to enable an absolute duration gate; leave unset to ignore duration entirely. | evals/src/types.ts:96 |
| <a id="property-maxavgscoredrop"></a> `maxAvgScoreDrop?` | `readonly` | `number` | Minimum drop in average score per scorer that counts as a regression. | evals/src/types.ts:88 |
| <a id="property-maxpassratedroppct"></a> `maxPassRateDropPct?` | `readonly` | `number` | Minimum drop in pass-rate (in percentage points) that counts as a regression. | evals/src/types.ts:86 |
