[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Block

# Interface: Block

Defined in: [packages/core/src/types/memory.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L124)

Working-memory block - a labeled, char-bounded slot rendered into the
system prompt every turn.

## Stable

## Extends

- [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`agentId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-agentid) | [packages/core/src/types/memory.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L105) |
| <a id="property-charlimit"></a> `charLimit` | `readonly` | `number` | - | - | - | [packages/core/src/types/memory.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L129) |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`createdAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-createdat) | [packages/core/src/types/memory.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L108) |
| <a id="property-deletedat"></a> `deletedAt?` | `readonly` | `string` | Soft-delete tombstone. Append-only stores set this instead of removing rows, so prior history is preserved per principle 8. | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`deletedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-deletedat) | [packages/core/src/types/memory.ts:114](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L114) |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - | - | - | [packages/core/src/types/memory.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L127) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`id`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-id) | [packages/core/src/types/memory.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L102) |
| <a id="property-kind"></a> `kind` | `readonly` | `"working"` | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`kind`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-kind) | - | [packages/core/src/types/memory.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L125) |
| <a id="property-label"></a> `label` | `readonly` | `string` | - | - | - | [packages/core/src/types/memory.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L126) |
| <a id="property-readonly"></a> `readOnly?` | `readonly` | `boolean` | - | - | - | [packages/core/src/types/memory.ts:130](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L130) |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sensitivity`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sensitivity) | [packages/core/src/types/memory.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L107) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sessionId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sessionid) | [packages/core/src/types/memory.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L106) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`tags`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-tags) | [packages/core/src/types/memory.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L115) |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`updatedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-updatedat) | [packages/core/src/types/memory.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L109) |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`userId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-userid) | [packages/core/src/types/memory.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L104) |
| <a id="property-value"></a> `value` | `readonly` | `string` | - | - | - | [packages/core/src/types/memory.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L128) |
