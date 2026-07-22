[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FusionWeights

# Interface: FusionWeights

Defined in: packages/memory/src/tiers/semantic-memory.ts:92

**`Stable`**

Per-list weights for [FusionStrategy](/api/@graphorin/memory/type-aliases/FusionStrategy.md) `'weighted'` fusion,
keyed by retriever *kind* rather than position so they survive the
multi-query fan-out (which appends extra FTS / vector candidate
lists). Each defaults to the neutral `1` (≡ RRF). The HyDE list is a
vector list and takes the `vector` weight.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-entity"></a> `entity?` | `readonly` | `number` | Weight applied to the exact entity-match candidate list. Default `1`. | packages/memory/src/tiers/semantic-memory.ts:105 |
| <a id="property-fts"></a> `fts?` | `readonly` | `number` | Weight applied to every FTS5 (lexical) candidate list. Default `1`. | packages/memory/src/tiers/semantic-memory.ts:94 |
| <a id="property-graph"></a> `graph?` | `readonly` | `number` | Weight applied to the graph-expansion candidate list. Default `1` (the previous neutral behaviour). Tune it once the graph leg's reliability is calibrated against labels - this makes the graph a first-class tunable fusion weight (it was hardcoded neutral). | packages/memory/src/tiers/semantic-memory.ts:103 |
| <a id="property-vector"></a> `vector?` | `readonly` | `number` | Weight applied to every vector (incl. HyDE) candidate list. Default `1`. | packages/memory/src/tiers/semantic-memory.ts:96 |
