[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionOptions

# Interface: RegressionOptions

Defined in: packages/evals/src/types.ts:103

**`Stable`**

Regression-detection options.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxavgdurationincreasems"></a> `maxAvgDurationIncreaseMs?` | `readonly` | `number` | Maximum allowed increase in `avgDurationMs` before it counts as a regression. **Opt-in: defaults to `Infinity` (gate off)** because absolute wall-clock budgets are environment-sensitive (workstation baseline vs CI runner, real LLM-latency jitter). Pass a finite ms budget to enable an absolute duration gate; leave unset to ignore duration entirely. | packages/evals/src/types.ts:123 |
| <a id="property-maxavgscoredrop"></a> `maxAvgScoreDrop?` | `readonly` | `number` | Tolerated drop in average score per scorer. Strictly-exceeds semantics, same as [RegressionOptions.maxPassRateDropPct](/api/@graphorin/evals/interfaces/RegressionOptions.md#property-maxpassratedroppct). | packages/evals/src/types.ts:115 |
| <a id="property-maxpassratedroppct"></a> `maxPassRateDropPct?` | `readonly` | `number` | Tolerated drop in pass-rate (in percentage points). A drop must strictly EXCEED this value to count as a regression - a drop equal to the tolerance passes (and raw float deltas can sit a hair above or below an exact boundary). | packages/evals/src/types.ts:110 |
| <a id="property-requiresignificance"></a> `requireSignificance?` | `readonly` | `boolean` | When `true`, a `pass-rate-drop` finding is only kept if McNemar's paired test over the shared cases rejects "no real change" at [significanceAlpha](/api/@graphorin/evals/interfaces/RegressionOptions.md#property-significancealpha) - a fixed percentage tolerance is blind to sample size (a 5pp drop is one case in a 20-case suite). Off by default so existing gates keep their exact behavior; the computed `pValue` is attached to the finding either way whenever both reports carry per-case results. | packages/evals/src/types.ts:133 |
| <a id="property-significancealpha"></a> `significanceAlpha?` | `readonly` | `number` | Significance level for [requireSignificance](/api/@graphorin/evals/interfaces/RegressionOptions.md#property-requiresignificance). Default `0.05`. | packages/evals/src/types.ts:135 |
