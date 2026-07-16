[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointPutOptions

# Interface: CheckpointPutOptions

Defined in: [packages/core/src/contracts/checkpoint-store.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L119)

Optional atomicity contract for [CheckpointStore.put](/api/@graphorin/core/interfaces/CheckpointStore.md#put) (D1 /
workflow-01). When `expectedLatestId` is supplied, the store MUST
perform the latest-checkpoint comparison and the insert atomically
(single transaction / synchronous critical section) and throw
[CheckpointConflictError](/api/@graphorin/core/classes/CheckpointConflictError.md) on mismatch - closing the TOCTOU
window an engine-level read-then-write cannot. `null` means "expect
no checkpoint for this thread yet"; `undefined` (or a store that
ignores the argument) preserves the unguarded legacy behaviour, which
the engine backstops with its own pre-check.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-expectedlatestid"></a> `expectedLatestId?` | `readonly` | `string` \| `null` | [packages/core/src/contracts/checkpoint-store.ts:120](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L120) |
