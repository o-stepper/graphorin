[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryPointScorerOptions

# Interface: MemoryPointScorerOptions

Defined in: packages/evals/src/scorers/memory/extraction.ts:26

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-matcher"></a> `matcher?` | `readonly` | [`MemoryPointMatcher`](/api/@graphorin/evals/type-aliases/MemoryPointMatcher.md) | Custom gold-vs-observed matcher. Default: [defaultMemoryPointMatcher](/api/@graphorin/evals/functions/defaultMemoryPointMatcher.md) - token-set F1 OR directional gold coverage. | packages/evals/src/scorers/memory/extraction.ts:34 |
| <a id="property-mingoldcoverage"></a> `minGoldCoverage?` | `readonly` | `number` | Threshold for the default matcher's gold-coverage leg. Default `0.6`. | packages/evals/src/scorers/memory/extraction.ts:38 |
| <a id="property-mintokenf1"></a> `minTokenF1?` | `readonly` | `number` | Threshold for the default matcher's F1 leg. Default `0.5`. | packages/evals/src/scorers/memory/extraction.ts:36 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. | packages/evals/src/scorers/memory/extraction.ts:28 |
| <a id="property-passthreshold"></a> `passThreshold?` | `readonly` | `number` | Metric value at or above which the case passes. Default `0.5`. | packages/evals/src/scorers/memory/extraction.ts:40 |
