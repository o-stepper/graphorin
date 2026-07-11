[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointTuple

# Interface: CheckpointTuple

Defined in: [packages/core/src/contracts/checkpoint-store.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L74)

A checkpoint paired with its sidecar metadata. Returned by
`CheckpointStore.getTuple(...)` and the `list(...)` iterator.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-checkpoint"></a> `checkpoint` | `readonly` | [`Checkpoint`](/api/@graphorin/core/interfaces/Checkpoint.md) | [packages/core/src/contracts/checkpoint-store.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L75) |
| <a id="property-metadata"></a> `metadata` | `readonly` | [`CheckpointMetadata`](/api/@graphorin/core/interfaces/CheckpointMetadata.md) | [packages/core/src/contracts/checkpoint-store.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L76) |
| <a id="property-pendingwrites"></a> `pendingWrites?` | `readonly` | readonly [`PendingWrite`](/api/@graphorin/core/interfaces/PendingWrite.md)[] | [packages/core/src/contracts/checkpoint-store.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L77) |
