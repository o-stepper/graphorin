[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PendingConflictRowLike

# Interface: PendingConflictRowLike

Defined in: [packages/memory/src/internal/storage-adapter.ts:343](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L343)

Read-back shape returned by `listPending(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attemptedat"></a> `attemptedAt` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:351](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L351) |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:347](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L347) |
| <a id="property-conflictingids"></a> `conflictingIds` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids; empty when omitted at enqueue. | [packages/memory/src/internal/storage-adapter.ts:355](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L355) |
| <a id="property-decision"></a> `decision` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:353](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L353) |
| <a id="property-enqueuedat"></a> `enqueuedAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:350](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L350) |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:346](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L346) |
| <a id="property-id"></a> `id` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:344](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L344) |
| <a id="property-reason"></a> `reason` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:349](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L349) |
| <a id="property-resolvedat"></a> `resolvedAt` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:352](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L352) |
| <a id="property-scopeuserid"></a> `scopeUserId` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:345](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L345) |
| <a id="property-stage"></a> `stage` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:348](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L348) |
