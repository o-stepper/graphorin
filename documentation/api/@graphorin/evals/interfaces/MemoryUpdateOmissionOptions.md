[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryUpdateOmissionOptions

# Interface: MemoryUpdateOmissionOptions

Defined in: packages/evals/src/scorers/memory/update.ts:32

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-matcher"></a> `matcher?` | `readonly` | [`MemoryPointMatcher`](/api/@graphorin/evals/type-aliases/MemoryPointMatcher.md) | Custom gold-vs-observed matcher. Default: token-set F1 at [minTokenF1](/api/@graphorin/evals/interfaces/MemoryUpdateOmissionOptions.md#property-mintokenf1). | packages/evals/src/scorers/memory/update.ts:36 |
| <a id="property-maxomissionrate"></a> `maxOmissionRate?` | `readonly` | `number` | Omission rate at or below which the case passes. Default `0.5`. | packages/evals/src/scorers/memory/update.ts:40 |
| <a id="property-mintokenf1"></a> `minTokenF1?` | `readonly` | `number` | Threshold for the default token-F1 matcher. Default `0.5`. | packages/evals/src/scorers/memory/update.ts:38 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. Default `'memory-update-omission'`. | packages/evals/src/scorers/memory/update.ts:34 |
