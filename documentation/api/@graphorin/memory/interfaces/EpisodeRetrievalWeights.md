[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EpisodeRetrievalWeights

# Interface: EpisodeRetrievalWeights

Defined in: packages/memory/src/tiers/episodic-memory.ts:54

Triple-signal episode retrieval weights. Defaults match DEC-105:
`recency 0.3`, `relevance 0.5`, `importance 0.2`. Implementations
normalize the weighted sum back to `[0, 1]`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-importance"></a> `importance` | `readonly` | `number` | packages/memory/src/tiers/episodic-memory.ts:57 |
| <a id="property-recency"></a> `recency` | `readonly` | `number` | packages/memory/src/tiers/episodic-memory.ts:55 |
| <a id="property-relevance"></a> `relevance` | `readonly` | `number` | packages/memory/src/tiers/episodic-memory.ts:56 |
