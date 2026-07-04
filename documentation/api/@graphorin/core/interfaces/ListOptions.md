[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ListOptions

# Interface: ListOptions

Defined in: packages/core/src/contracts/checkpoint-store.ts:80

Optional listing range for `CheckpointStore.list(...)`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before?` | `readonly` | `string` | packages/core/src/contracts/checkpoint-store.ts:82 |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | packages/core/src/contracts/checkpoint-store.ts:81 |
| <a id="property-status"></a> `status?` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | packages/core/src/contracts/checkpoint-store.ts:83 |
