[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / ListOptions

# Interface: ListOptions

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:70

Optional listing range for `CheckpointStore.list(...)`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before?` | `readonly` | `string` | packages/core/dist/contracts/checkpoint-store.d.ts:72 |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | packages/core/dist/contracts/checkpoint-store.d.ts:71 |
| <a id="property-status"></a> `status?` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | packages/core/dist/contracts/checkpoint-store.d.ts:73 |
