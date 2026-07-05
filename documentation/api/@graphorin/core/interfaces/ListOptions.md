[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ListOptions

# Interface: ListOptions

Defined in: packages/core/src/contracts/checkpoint-store.ts:90

Optional listing range for `CheckpointStore.list(...)`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before?` | `readonly` | `string` | packages/core/src/contracts/checkpoint-store.ts:92 |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | packages/core/src/contracts/checkpoint-store.ts:91 |
| <a id="property-status"></a> `status?` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | packages/core/src/contracts/checkpoint-store.ts:93 |
