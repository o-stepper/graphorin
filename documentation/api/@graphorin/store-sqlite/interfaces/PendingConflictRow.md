[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / PendingConflictRow

# Interface: PendingConflictRow

Defined in: [packages/store-sqlite/src/conflict-store.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L100)

Read-back shape for `listPending(...)`. Surfaces the row id so the
deep phase can claim + resolve it later.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attemptedat"></a> `attemptedAt` | `readonly` | `number` \| `null` | - | [packages/store-sqlite/src/conflict-store.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L108) |
| <a id="property-candidatetext"></a> `candidateText` | `readonly` | `string` | - | [packages/store-sqlite/src/conflict-store.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L104) |
| <a id="property-conflictingids"></a> `conflictingIds` | `readonly` | readonly `string`[] | Top-K conflicting existing fact ids; empty when omitted at enqueue. | [packages/store-sqlite/src/conflict-store.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L112) |
| <a id="property-decision"></a> `decision` | `readonly` | `string` \| `null` | - | [packages/store-sqlite/src/conflict-store.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L110) |
| <a id="property-enqueuedat"></a> `enqueuedAt` | `readonly` | `number` | - | [packages/store-sqlite/src/conflict-store.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L107) |
| <a id="property-factid"></a> `factId` | `readonly` | `string` | - | [packages/store-sqlite/src/conflict-store.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L103) |
| <a id="property-id"></a> `id` | `readonly` | `number` | - | [packages/store-sqlite/src/conflict-store.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L101) |
| <a id="property-reason"></a> `reason` | `readonly` | `string` \| `null` | - | [packages/store-sqlite/src/conflict-store.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L106) |
| <a id="property-resolvedat"></a> `resolvedAt` | `readonly` | `number` \| `null` | - | [packages/store-sqlite/src/conflict-store.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L109) |
| <a id="property-scopeuserid"></a> `scopeUserId` | `readonly` | `string` | - | [packages/store-sqlite/src/conflict-store.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L102) |
| <a id="property-stage"></a> `stage` | `readonly` | `string` | - | [packages/store-sqlite/src/conflict-store.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/conflict-store.ts#L105) |
