[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EpisodeSearchOptions

# Interface: EpisodeSearchOptions

Defined in: packages/memory/src/tiers/episodic-memory.ts:74

Per-call options accepted by [EpisodicMemory.search](/api/@graphorin/memory/classes/EpisodicMemory.md#search).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-asof"></a> `asOf?` | `readonly` | `string` | Point-in-time ("as of") read. When set, only episodes that had started by this instant (`started_at <= asOf`) are returned. ISO-8601. Absent ⇒ current behaviour is unchanged. P0-2. **Stable** | packages/memory/src/tiers/episodic-memory.ts:86 |
| <a id="property-daterange"></a> `dateRange?` | `readonly` | \{ `from?`: `string`; `to?`: `string`; \} | - | packages/memory/src/tiers/episodic-memory.ts:78 |
| `dateRange.from?` | `readonly` | `string` | - | packages/memory/src/tiers/episodic-memory.ts:78 |
| `dateRange.to?` | `readonly` | `string` | - | packages/memory/src/tiers/episodic-memory.ts:78 |
| <a id="property-includequarantined"></a> `includeQuarantined?` | `readonly` | `boolean` | Include quarantined episodes in the result set (P1-4). Defaults to `false`: action-driving recall never returns quarantined rows. Set `true` only for the validation / inspector path — never for auto-recall fed back into the model. Auto-formed episodes (P1-2) land quarantined, so this is how an operator surfaces them for review. **Stable** | packages/memory/src/tiers/episodic-memory.ts:97 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/memory/src/tiers/episodic-memory.ts:76 |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | - | packages/memory/src/tiers/episodic-memory.ts:75 |
| <a id="property-weights"></a> `weights?` | `readonly` | [`EpisodeRetrievalWeights`](/api/@graphorin/memory/interfaces/EpisodeRetrievalWeights.md) | - | packages/memory/src/tiers/episodic-memory.ts:77 |
