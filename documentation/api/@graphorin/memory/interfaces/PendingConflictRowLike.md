[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PendingConflictRowLike

# Interface: PendingConflictRowLike

Defined in: packages/memory/src/internal/storage-adapter.ts:216

Read-back shape returned by `listPending(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attemptedat"></a> `attemptedAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:224 |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:220 |
| <a id="property-conflictingids"></a> `conflictingIds` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids; empty when omitted at enqueue. | packages/memory/src/internal/storage-adapter.ts:228 |
| <a id="property-decision"></a> `decision` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:226 |
| <a id="property-enqueuedat"></a> `enqueuedAt` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:223 |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:219 |
| <a id="property-id"></a> `id` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:217 |
| <a id="property-reason"></a> `reason` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:222 |
| <a id="property-resolvedat"></a> `resolvedAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:225 |
| <a id="property-scopeuserid"></a> `scopeUserId` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:218 |
| <a id="property-stage"></a> `stage` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:221 |
