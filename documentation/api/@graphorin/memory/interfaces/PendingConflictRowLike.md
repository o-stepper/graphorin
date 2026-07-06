[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PendingConflictRowLike

# Interface: PendingConflictRowLike

Defined in: packages/memory/src/internal/storage-adapter.ts:323

Read-back shape returned by `listPending(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attemptedat"></a> `attemptedAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:331 |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:327 |
| <a id="property-conflictingids"></a> `conflictingIds` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids; empty when omitted at enqueue. | packages/memory/src/internal/storage-adapter.ts:335 |
| <a id="property-decision"></a> `decision` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:333 |
| <a id="property-enqueuedat"></a> `enqueuedAt` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:330 |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:326 |
| <a id="property-id"></a> `id` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:324 |
| <a id="property-reason"></a> `reason` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:329 |
| <a id="property-resolvedat"></a> `resolvedAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:332 |
| <a id="property-scopeuserid"></a> `scopeUserId` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:325 |
| <a id="property-stage"></a> `stage` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:328 |
