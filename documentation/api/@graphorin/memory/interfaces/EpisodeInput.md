[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EpisodeInput

# Interface: EpisodeInput

Defined in: packages/memory/src/tiers/episodic-memory.ts:21

Author-time episode payload. The framework derives `id`,
`kind: 'episodic'`, `userId`, `createdAt`, `updatedAt`, and the
`embedder_id` from the surrounding `EpisodicMemory.record(...)`
call.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-endedat"></a> `endedAt` | `readonly` | `string` | - | packages/memory/src/tiers/episodic-memory.ts:24 |
| <a id="property-importance"></a> `importance?` | `readonly` | `number` | Optional importance score in `[0, 1]`. | packages/memory/src/tiers/episodic-memory.ts:26 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/memory/src/tiers/episodic-memory.ts:27 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | packages/memory/src/tiers/episodic-memory.ts:23 |
| <a id="property-summary"></a> `summary` | `readonly` | `string` | - | packages/memory/src/tiers/episodic-memory.ts:22 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/memory/src/tiers/episodic-memory.ts:28 |
