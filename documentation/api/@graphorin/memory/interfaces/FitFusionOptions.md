[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FitFusionOptions

# Interface: FitFusionOptions

Defined in: packages/memory/src/search/fit-weights.ts:32

Options for [fitFusionWeights](/api/@graphorin/memory/functions/fitFusionWeights.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-grid"></a> `grid?` | `readonly` | readonly `number`[] | Candidate weight values per axis. Default `[0.25, 0.5, 1, 2, 4]`. | packages/memory/src/search/fit-weights.ts:34 |
| <a id="property-k"></a> `k?` | `readonly` | `number` | nDCG cutoff. Default `10`. | packages/memory/src/search/fit-weights.ts:36 |
| <a id="property-rrfk"></a> `rrfK?` | `readonly` | `number` | RRF constant forwarded to the fuse. Default `60`. | packages/memory/src/search/fit-weights.ts:38 |
