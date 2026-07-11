[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RegressionOptions

# Interface: RegressionOptions

Defined in: [packages/evals/src/types.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L103)

Regression-detection options.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxavgdurationincreasems"></a> `maxAvgDurationIncreaseMs?` | `readonly` | `number` | Maximum allowed increase in `avgDurationMs` before it counts as a regression. **Opt-in: defaults to `Infinity` (gate off)** because absolute wall-clock budgets are environment-sensitive (workstation baseline vs CI runner, real LLM-latency jitter). Pass a finite ms budget to enable an absolute duration gate; leave unset to ignore duration entirely. | [packages/evals/src/types.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L115) |
| <a id="property-maxavgscoredrop"></a> `maxAvgScoreDrop?` | `readonly` | `number` | Minimum drop in average score per scorer that counts as a regression. | [packages/evals/src/types.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L107) |
| <a id="property-maxpassratedroppct"></a> `maxPassRateDropPct?` | `readonly` | `number` | Minimum drop in pass-rate (in percentage points) that counts as a regression. | [packages/evals/src/types.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L105) |
| <a id="property-requiresignificance"></a> `requireSignificance?` | `readonly` | `boolean` | E8 (evals-05/08): when `true`, a `pass-rate-drop` finding is only kept if McNemar's paired test over the shared cases rejects "no real change" at [significanceAlpha](/api/@graphorin/evals/interfaces/RegressionOptions.md#property-significancealpha) - a fixed percentage tolerance is blind to sample size (a 5pp drop is one case in a 20-case suite). Off by default so existing gates keep their exact behavior; the computed `pValue` is attached to the finding either way whenever both reports carry per-case results. | [packages/evals/src/types.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L125) |
| <a id="property-significancealpha"></a> `significanceAlpha?` | `readonly` | `number` | Significance level for [requireSignificance](/api/@graphorin/evals/interfaces/RegressionOptions.md#property-requiresignificance). Default `0.05`. | [packages/evals/src/types.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L127) |
