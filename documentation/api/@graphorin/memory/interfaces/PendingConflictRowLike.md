[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PendingConflictRowLike

# Interface: PendingConflictRowLike

Defined in: packages/memory/src/internal/storage-adapter.ts:260

Read-back shape returned by `listPending(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attemptedat"></a> `attemptedAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:268 |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:264 |
| <a id="property-conflictingids"></a> `conflictingIds` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids; empty when omitted at enqueue. | packages/memory/src/internal/storage-adapter.ts:272 |
| <a id="property-decision"></a> `decision` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:270 |
| <a id="property-enqueuedat"></a> `enqueuedAt` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:267 |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:263 |
| <a id="property-id"></a> `id` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:261 |
| <a id="property-reason"></a> `reason` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:266 |
| <a id="property-resolvedat"></a> `resolvedAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:269 |
| <a id="property-scopeuserid"></a> `scopeUserId` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:262 |
| <a id="property-stage"></a> `stage` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:265 |
