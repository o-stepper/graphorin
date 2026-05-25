[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FusionWeights

# Interface: FusionWeights

Defined in: packages/memory/src/tiers/semantic-memory.ts:68

Per-list weights for [FusionStrategy](/api/@graphorin/memory/type-aliases/FusionStrategy.md) `'weighted'` fusion (X-2),
keyed by retriever *kind* rather than position so they survive the
P2-3 multi-query fan-out (which appends extra FTS / vector candidate
lists). Each defaults to the neutral `1` (≡ RRF). The HyDE list is a
vector list and takes the `vector` weight.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fts"></a> `fts?` | `readonly` | `number` | Weight applied to every FTS5 (lexical) candidate list. Default `1`. | packages/memory/src/tiers/semantic-memory.ts:70 |
| <a id="property-vector"></a> `vector?` | `readonly` | `number` | Weight applied to every vector (incl. HyDE) candidate list. Default `1`. | packages/memory/src/tiers/semantic-memory.ts:72 |
