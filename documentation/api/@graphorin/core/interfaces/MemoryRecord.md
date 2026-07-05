[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryRecord

# Interface: MemoryRecord

Defined in: packages/core/src/types/memory.ts:101

Marker shared by every memory record. Concrete records (`Block`,
`Fact`, `Episode`, `Rule`, message rows) all extend it.

## Stable

## Extended by

- [`Block`](/api/@graphorin/core/interfaces/Block.md)
- [`Episode`](/api/@graphorin/core/interfaces/Episode.md)
- [`Fact`](/api/@graphorin/core/interfaces/Fact.md)
- [`Insight`](/api/@graphorin/core/interfaces/Insight.md)
- [`Rule`](/api/@graphorin/core/interfaces/Rule.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | packages/core/src/types/memory.ts:105 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | packages/core/src/types/memory.ts:108 |
| <a id="property-deletedat"></a> `deletedAt?` | `readonly` | `string` | Soft-delete tombstone. Append-only stores set this instead of removing rows, so prior history is preserved per principle 8. | packages/core/src/types/memory.ts:114 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/core/src/types/memory.ts:102 |
| <a id="property-kind"></a> `kind` | `readonly` | [`MemoryKind`](/api/@graphorin/core/type-aliases/MemoryKind.md) | - | packages/core/src/types/memory.ts:103 |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/core/src/types/memory.ts:107 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | packages/core/src/types/memory.ts:106 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/core/src/types/memory.ts:115 |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | packages/core/src/types/memory.ts:109 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | packages/core/src/types/memory.ts:104 |
