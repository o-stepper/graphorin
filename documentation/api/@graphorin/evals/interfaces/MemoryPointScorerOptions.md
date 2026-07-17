[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryPointScorerOptions

# Interface: MemoryPointScorerOptions

Defined in: [packages/evals/src/scorers/memory/extraction.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/extraction.ts#L21)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-matcher"></a> `matcher?` | `readonly` | [`MemoryPointMatcher`](/api/@graphorin/evals/type-aliases/MemoryPointMatcher.md) | Custom gold-vs-observed matcher. Default: token-set F1 at [minTokenF1](/api/@graphorin/evals/interfaces/MemoryPointScorerOptions.md#property-mintokenf1). | [packages/evals/src/scorers/memory/extraction.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/extraction.ts#L25) |
| <a id="property-mintokenf1"></a> `minTokenF1?` | `readonly` | `number` | Threshold for the default token-F1 matcher. Default `0.5`. | [packages/evals/src/scorers/memory/extraction.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/extraction.ts#L27) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. | [packages/evals/src/scorers/memory/extraction.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/extraction.ts#L23) |
| <a id="property-passthreshold"></a> `passThreshold?` | `readonly` | `number` | Metric value at or above which the case passes. Default `0.5`. | [packages/evals/src/scorers/memory/extraction.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/extraction.ts#L29) |
