[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / PendingConflictRow

# Interface: PendingConflictRow

Defined in: packages/store-sqlite/src/conflict-store.ts:100

**`Stable`**

Read-back shape for `listPending(...)`. Surfaces the row id so the
deep phase can claim + resolve it later.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attemptedat"></a> `attemptedAt` | `readonly` | `number` \| `null` | - | packages/store-sqlite/src/conflict-store.ts:108 |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | packages/store-sqlite/src/conflict-store.ts:104 |
| <a id="property-conflictingids"></a> `conflictingIds` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids; empty when omitted at enqueue. | packages/store-sqlite/src/conflict-store.ts:112 |
| <a id="property-decision"></a> `decision` | `readonly` | `string` \| `null` | - | packages/store-sqlite/src/conflict-store.ts:110 |
| <a id="property-enqueuedat"></a> `enqueuedAt` | `readonly` | `number` | - | packages/store-sqlite/src/conflict-store.ts:107 |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | packages/store-sqlite/src/conflict-store.ts:103 |
| <a id="property-id"></a> `id` | `readonly` | `number` | - | packages/store-sqlite/src/conflict-store.ts:101 |
| <a id="property-reason"></a> `reason` | `readonly` | `string` \| `null` | - | packages/store-sqlite/src/conflict-store.ts:106 |
| <a id="property-resolvedat"></a> `resolvedAt` | `readonly` | `number` \| `null` | - | packages/store-sqlite/src/conflict-store.ts:109 |
| <a id="property-scopeuserid"></a> `scopeUserId` | `readonly` | `string` | - | packages/store-sqlite/src/conflict-store.ts:102 |
| <a id="property-stage"></a> `stage` | `readonly` | `string` | - | packages/store-sqlite/src/conflict-store.ts:105 |
