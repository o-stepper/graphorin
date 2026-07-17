[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PendingConflictRowLike

# Interface: PendingConflictRowLike

Defined in: [packages/memory/src/internal/storage-adapter.ts:386](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L386)

Read-back shape returned by `listPending(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attemptedat"></a> `attemptedAt` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:394](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L394) |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:390](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L390) |
| <a id="property-conflictingids"></a> `conflictingIds` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids; empty when omitted at enqueue. | [packages/memory/src/internal/storage-adapter.ts:398](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L398) |
| <a id="property-decision"></a> `decision` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:396](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L396) |
| <a id="property-enqueuedat"></a> `enqueuedAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:393](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L393) |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:389](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L389) |
| <a id="property-id"></a> `id` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:387](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L387) |
| <a id="property-reason"></a> `reason` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:392](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L392) |
| <a id="property-resolvedat"></a> `resolvedAt` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:395](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L395) |
| <a id="property-scopeuserid"></a> `scopeUserId` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:388](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L388) |
| <a id="property-stage"></a> `stage` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:391](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L391) |
