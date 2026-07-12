[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FusionWeights

# Interface: FusionWeights

Defined in: [packages/memory/src/tiers/semantic-memory.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L92)

Per-list weights for [FusionStrategy](/api/@graphorin/memory/type-aliases/FusionStrategy.md) `'weighted'` fusion (X-2),
keyed by retriever *kind* rather than position so they survive the
P2-3 multi-query fan-out (which appends extra FTS / vector candidate
lists). Each defaults to the neutral `1` (≡ RRF). The HyDE list is a
vector list and takes the `vector` weight.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-entity"></a> `entity?` | `readonly` | `number` | Weight applied to the exact entity-match candidate list (D5). Default `1`. | [packages/memory/src/tiers/semantic-memory.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L105) |
| <a id="property-fts"></a> `fts?` | `readonly` | `number` | Weight applied to every FTS5 (lexical) candidate list. Default `1`. | [packages/memory/src/tiers/semantic-memory.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L94) |
| <a id="property-graph"></a> `graph?` | `readonly` | `number` | Weight applied to the graph-expansion candidate list (D5). Default `1` (the previous neutral behaviour). Tune it once the graph leg's reliability is calibrated against labels - the roadmap's "graph as a first-class tunable fusion weight" (was hardcoded neutral). | [packages/memory/src/tiers/semantic-memory.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L103) |
| <a id="property-vector"></a> `vector?` | `readonly` | `number` | Weight applied to every vector (incl. HyDE) candidate list. Default `1`. | [packages/memory/src/tiers/semantic-memory.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L96) |
