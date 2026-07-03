[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / CheckpointTuple

# Interface: CheckpointTuple

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:46

A checkpoint paired with its sidecar metadata. Returned by
`CheckpointStore.getTuple(...)` and the `list(...)` iterator.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-checkpoint"></a> `checkpoint` | `readonly` | [`Checkpoint`](/api/@graphorin/workflow/interfaces/Checkpoint.md) | packages/core/dist/contracts/checkpoint-store.d.ts:47 |
| <a id="property-metadata"></a> `metadata` | `readonly` | [`CheckpointMetadata`](/api/@graphorin/workflow/interfaces/CheckpointMetadata.md) | packages/core/dist/contracts/checkpoint-store.d.ts:48 |
| <a id="property-pendingwrites"></a> `pendingWrites?` | `readonly` | readonly [`PendingWrite`](/api/@graphorin/workflow/interfaces/PendingWrite.md)[] | packages/core/dist/contracts/checkpoint-store.d.ts:49 |
