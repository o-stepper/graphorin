[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FitFusionResult

# Interface: FitFusionResult

Defined in: packages/memory/src/search/fit-weights.ts:42

Result of a fit: the winning weights + its score and the RRF baseline.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-baseline"></a> `baseline` | `readonly` | `number` | Mean nDCG@k of unit weights (plain RRF) - compare before adopting. | packages/memory/src/search/fit-weights.ts:47 |
| <a id="property-score"></a> `score` | `readonly` | `number` | Mean nDCG@k of the winning weights across the cases. | packages/memory/src/search/fit-weights.ts:45 |
| <a id="property-weights"></a> `weights` | `readonly` | \{ `fts`: `number`; `vector`: `number`; \} | - | packages/memory/src/search/fit-weights.ts:43 |
| `weights.fts` | `readonly` | `number` | - | packages/memory/src/search/fit-weights.ts:43 |
| `weights.vector` | `readonly` | `number` | - | packages/memory/src/search/fit-weights.ts:43 |
