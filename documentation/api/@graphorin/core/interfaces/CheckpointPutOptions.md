[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointPutOptions

# Interface: CheckpointPutOptions

Defined in: packages/core/src/contracts/checkpoint-store.ts:118

**`Stable`**

Optional atomicity contract for [CheckpointStore.put](/api/@graphorin/core/interfaces/CheckpointStore.md#put).
When `expectedLatestId` is supplied, the store MUST
perform the latest-checkpoint comparison and the insert atomically
(single transaction / synchronous critical section) and throw
[CheckpointConflictError](/api/@graphorin/core/classes/CheckpointConflictError.md) on mismatch - closing the TOCTOU
window an engine-level read-then-write cannot. `null` means "expect
no checkpoint for this thread yet"; `undefined` (or a store that
ignores the argument) preserves the unguarded legacy behaviour, which
the engine backstops with its own pre-check.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-expectedlatestid"></a> `expectedLatestId?` | `readonly` | `string` \| `null` | packages/core/src/contracts/checkpoint-store.ts:119 |
