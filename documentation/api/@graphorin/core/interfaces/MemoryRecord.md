[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryRecord

# Interface: MemoryRecord

Defined in: [packages/core/src/types/memory.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L101)

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
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | [packages/core/src/types/memory.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L105) |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | [packages/core/src/types/memory.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L108) |
| <a id="property-deletedat"></a> `deletedAt?` | `readonly` | `string` | Soft-delete tombstone. Append-only stores set this instead of removing rows, so prior history is preserved per principle 8. | [packages/core/src/types/memory.ts:114](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L114) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/core/src/types/memory.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L102) |
| <a id="property-kind"></a> `kind` | `readonly` | [`MemoryKind`](/api/@graphorin/core/type-aliases/MemoryKind.md) | - | [packages/core/src/types/memory.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L103) |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | [packages/core/src/types/memory.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L107) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | [packages/core/src/types/memory.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L106) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | [packages/core/src/types/memory.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L115) |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | [packages/core/src/types/memory.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L109) |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | [packages/core/src/types/memory.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L104) |
