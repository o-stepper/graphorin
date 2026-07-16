[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Episode

# Interface: Episode

Defined in: [packages/core/src/types/memory.ts:198](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L198)

Episode - a summarized stretch of past activity.

## Stable

## Extends

- [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`agentId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-agentid) | [packages/core/src/types/memory.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L105) |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`createdAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-createdat) | [packages/core/src/types/memory.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L108) |
| <a id="property-deletedat"></a> `deletedAt?` | `readonly` | `string` | Soft-delete tombstone. Append-only stores set this instead of removing rows, so prior history is preserved per principle 8. | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`deletedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-deletedat) | [packages/core/src/types/memory.ts:114](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L114) |
| <a id="property-endedat"></a> `endedAt` | `readonly` | `string` | ISO-8601 of the latest event in the episode. | - | - | [packages/core/src/types/memory.ts:204](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L204) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`id`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-id) | [packages/core/src/types/memory.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L102) |
| <a id="property-importance"></a> `importance?` | `readonly` | `number` | Optional importance score in `[0, 1]`. | - | - | [packages/core/src/types/memory.ts:206](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L206) |
| <a id="property-kind"></a> `kind` | `readonly` | `"episodic"` | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`kind`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-kind) | - | [packages/core/src/types/memory.ts:199](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L199) |
| <a id="property-owner"></a> `owner?` | `readonly` | [`MemoryOwner`](/api/@graphorin/core/type-aliases/MemoryOwner.md) | Principal dimension (D3). See [MemoryOwner](/api/@graphorin/core/type-aliases/MemoryOwner.md). | - | - | [packages/core/src/types/memory.ts:212](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L212) |
| <a id="property-provenance"></a> `provenance?` | `readonly` | [`MemoryProvenance`](/api/@graphorin/core/type-aliases/MemoryProvenance.md) | Trust-provenance tag (P1-4). See [MemoryProvenance](/api/@graphorin/core/type-aliases/MemoryProvenance.md). | - | - | [packages/core/src/types/memory.ts:208](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L208) |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sensitivity`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sensitivity) | [packages/core/src/types/memory.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L107) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`sessionId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-sessionid) | [packages/core/src/types/memory.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L106) |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | ISO-8601 of the earliest event in the episode. | - | - | [packages/core/src/types/memory.ts:202](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L202) |
| <a id="property-status"></a> `status?` | `readonly` | [`MemoryStatus`](/api/@graphorin/core/type-aliases/MemoryStatus.md) | Retrieval-trust state (P1-4). See [MemoryStatus](/api/@graphorin/core/type-aliases/MemoryStatus.md). | - | - | [packages/core/src/types/memory.ts:210](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L210) |
| <a id="property-summary"></a> `summary` | `readonly` | `string` | - | - | - | [packages/core/src/types/memory.ts:200](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L200) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`tags`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-tags) | [packages/core/src/types/memory.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L115) |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`updatedAt`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-updatedat) | [packages/core/src/types/memory.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L109) |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | - | - | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md).[`userId`](/api/@graphorin/core/interfaces/MemoryRecord.md#property-userid) | [packages/core/src/types/memory.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L104) |
