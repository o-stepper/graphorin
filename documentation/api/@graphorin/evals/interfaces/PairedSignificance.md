[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / PairedSignificance

# Interface: PairedSignificance

Defined in: evals/src/stats.ts:125

Result of [pairedPassSignificance](/api/@graphorin/evals/functions/pairedPassSignificance.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-improved"></a> `improved` | `readonly` | `number` | baseline-fail -> current-pass count (the improvements). | evals/src/stats.ts:131 |
| <a id="property-pairs"></a> `pairs` | `readonly` | `number` | Cases present in BOTH runs (the paired sample). | evals/src/stats.ts:127 |
| <a id="property-pvalue"></a> `pValue` | `readonly` | `number` | Two-sided p-value from McNemar's test (continuity-corrected normal approximation over the discordant pairs). `1` when there are no discordant pairs - identical outcomes are never "significant". | evals/src/stats.ts:137 |
| <a id="property-regressed"></a> `regressed` | `readonly` | `number` | baseline-pass -> current-fail count (the regressions). | evals/src/stats.ts:129 |
