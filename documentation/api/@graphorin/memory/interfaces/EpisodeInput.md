[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EpisodeInput

# Interface: EpisodeInput

Defined in: packages/memory/src/tiers/episodic-memory.ts:23

Author-time episode payload. The framework derives `id`,
`kind: 'episodic'`, `userId`, `createdAt`, `updatedAt`, and the
`embedder_id` from the surrounding `EpisodicMemory.record(...)`
call.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-endedat"></a> `endedAt` | `readonly` | `string` | - | packages/memory/src/tiers/episodic-memory.ts:26 |
| <a id="property-importance"></a> `importance?` | `readonly` | `number` | Optional importance score in `[0, 1]`. | packages/memory/src/tiers/episodic-memory.ts:28 |
| <a id="property-provenance"></a> `provenance?` | `readonly` | [`MemoryProvenance`](/api/@graphorin/core/type-aliases/MemoryProvenance.md) | Trust-provenance tag (P1-4). Episodes auto-formed by the consolidator pass `'extraction'` so they land quarantined; omit (defaults to first-party `active`) for user-authored episodes. | packages/memory/src/tiers/episodic-memory.ts:36 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/memory/src/tiers/episodic-memory.ts:29 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | packages/memory/src/tiers/episodic-memory.ts:25 |
| <a id="property-status"></a> `status?` | `readonly` | [`MemoryStatus`](/api/@graphorin/core/type-aliases/MemoryStatus.md) | Retrieval-trust state (P1-4). Defaults to `active`; the consolidator records auto-formed episodes as `'quarantined'` so they are excluded from action-driving recall until validated. | packages/memory/src/tiers/episodic-memory.ts:42 |
| <a id="property-summary"></a> `summary` | `readonly` | `string` | - | packages/memory/src/tiers/episodic-memory.ts:24 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/memory/src/tiers/episodic-memory.ts:30 |
