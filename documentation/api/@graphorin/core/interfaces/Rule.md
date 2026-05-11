[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Rule

# Interface: Rule

Defined in: packages/core/src/types/memory.ts:115

Procedural rule — a standing order activated when its `condition` matches.

## Stable

## Extends

- [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`agentId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-agentid) | packages/core/src/types/memory.ts:47 |
| <a id="property-condition"></a> `condition?` | `readonly` | `string` | - | - | - | packages/core/src/types/memory.ts:118 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`createdAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-createdat) | packages/core/src/types/memory.ts:50 |
| <a id="property-deletedat"></a> `deletedAt?` | `readonly` | `string` | Soft-delete tombstone. Append-only stores set this instead of removing rows, so prior history is preserved per principle 8. | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`deletedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-deletedat) | packages/core/src/types/memory.ts:56 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`id`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-id) | packages/core/src/types/memory.ts:44 |
| <a id="property-kind"></a> `kind` | `readonly` | `"procedural"` | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`kind`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-kind) | - | packages/core/src/types/memory.ts:116 |
| <a id="property-priority"></a> `priority` | `readonly` | `number` | - | - | - | packages/core/src/types/memory.ts:119 |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sensitivity`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sensitivity) | packages/core/src/types/memory.ts:49 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sessionId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sessionid) | packages/core/src/types/memory.ts:48 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`tags`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-tags) | packages/core/src/types/memory.ts:57 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | - | - | packages/core/src/types/memory.ts:117 |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`updatedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-updatedat) | packages/core/src/types/memory.ts:51 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`userId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-userid) | packages/core/src/types/memory.ts:46 |
