[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / ListOptions

# Interface: ListOptions

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:76

Optional listing range for `CheckpointStore.list(...)`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before?` | `readonly` | `string` | packages/core/dist/contracts/checkpoint-store.d.ts:78 |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | packages/core/dist/contracts/checkpoint-store.d.ts:77 |
| <a id="property-status"></a> `status?` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | packages/core/dist/contracts/checkpoint-store.d.ts:79 |
