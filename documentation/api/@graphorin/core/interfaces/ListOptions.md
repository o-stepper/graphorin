[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ListOptions

# Interface: ListOptions

Defined in: packages/core/src/contracts/checkpoint-store.ts:99

**`Stable`**

Optional listing range for `CheckpointStore.list(...)`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before?` | `readonly` | `string` | packages/core/src/contracts/checkpoint-store.ts:101 |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | packages/core/src/contracts/checkpoint-store.ts:100 |
| <a id="property-status"></a> `status?` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | packages/core/src/contracts/checkpoint-store.ts:102 |
