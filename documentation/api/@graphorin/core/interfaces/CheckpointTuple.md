[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointTuple

# Interface: CheckpointTuple

Defined in: packages/core/src/contracts/checkpoint-store.ts:48

A checkpoint paired with its sidecar metadata. Returned by
`CheckpointStore.getTuple(...)` and the `list(...)` iterator.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-checkpoint"></a> `checkpoint` | `readonly` | [`Checkpoint`](/api/@graphorin/core/interfaces/Checkpoint.md) | packages/core/src/contracts/checkpoint-store.ts:49 |
| <a id="property-metadata"></a> `metadata` | `readonly` | [`CheckpointMetadata`](/api/@graphorin/core/interfaces/CheckpointMetadata.md) | packages/core/src/contracts/checkpoint-store.ts:50 |
| <a id="property-pendingwrites"></a> `pendingWrites?` | `readonly` | readonly [`PendingWrite`](/api/@graphorin/core/interfaces/PendingWrite.md)[] | packages/core/src/contracts/checkpoint-store.ts:51 |
