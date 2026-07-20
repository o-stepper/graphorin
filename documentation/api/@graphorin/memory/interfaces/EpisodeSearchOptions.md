[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EpisodeSearchOptions

# Interface: EpisodeSearchOptions

Defined in: packages/memory/src/tiers/episodic-memory.ts:74

**`Stable`**

Per-call options accepted by [EpisodicMemory.search](/api/@graphorin/memory/classes/EpisodicMemory.md#search).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-asof"></a> `asOf?` | `readonly` | `string` | **`Stable`** Point-in-time ("as of") read. When set, only episodes that had started by this instant (`started_at <= asOf`) are returned. ISO-8601. Absent ⇒ current behaviour is unchanged. | packages/memory/src/tiers/episodic-memory.ts:86 |
| <a id="property-daterange"></a> `dateRange?` | `readonly` | \{ `from?`: `string`; `to?`: `string`; \} | - | packages/memory/src/tiers/episodic-memory.ts:78 |
| `dateRange.from?` | `readonly` | `string` | - | packages/memory/src/tiers/episodic-memory.ts:78 |
| `dateRange.to?` | `readonly` | `string` | - | packages/memory/src/tiers/episodic-memory.ts:78 |
| <a id="property-includequarantined"></a> `includeQuarantined?` | `readonly` | `boolean` | **`Stable`** Include quarantined episodes in the result set. Defaults to `false`: action-driving recall never returns quarantined rows. Set `true` only for the validation / inspector path - never for auto-recall fed back into the model. Auto-formed episodes land quarantined, so this is how an operator surfaces them for review. | packages/memory/src/tiers/episodic-memory.ts:97 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/memory/src/tiers/episodic-memory.ts:76 |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | - | packages/memory/src/tiers/episodic-memory.ts:75 |
| <a id="property-weights"></a> `weights?` | `readonly` | [`EpisodeRetrievalWeights`](/api/@graphorin/memory/interfaces/EpisodeRetrievalWeights.md) | - | packages/memory/src/tiers/episodic-memory.ts:77 |
