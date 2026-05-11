[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EpisodeSearchOptions

# Interface: EpisodeSearchOptions

Defined in: packages/memory/src/tiers/episodic-memory.ts:55

Per-call options accepted by [EpisodicMemory.search](/api/@graphorin/memory/classes/EpisodicMemory.md#search).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-daterange"></a> `dateRange?` | `readonly` | \{ `from?`: `string`; `to?`: `string`; \} | packages/memory/src/tiers/episodic-memory.ts:59 |
| `dateRange.from?` | `readonly` | `string` | packages/memory/src/tiers/episodic-memory.ts:59 |
| `dateRange.to?` | `readonly` | `string` | packages/memory/src/tiers/episodic-memory.ts:59 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/memory/src/tiers/episodic-memory.ts:57 |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | packages/memory/src/tiers/episodic-memory.ts:56 |
| <a id="property-weights"></a> `weights?` | `readonly` | [`EpisodeRetrievalWeights`](/api/@graphorin/memory/interfaces/EpisodeRetrievalWeights.md) | packages/memory/src/tiers/episodic-memory.ts:58 |
