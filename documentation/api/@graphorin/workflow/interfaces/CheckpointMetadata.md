[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / CheckpointMetadata

# Interface: CheckpointMetadata

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:34

Metadata associated with a checkpoint write. Adapters store this in a
sidecar table for efficient listing.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-nodename"></a> `nodeName?` | `readonly` | `string` | packages/core/dist/contracts/checkpoint-store.d.ts:37 |
| <a id="property-source"></a> `source` | `readonly` | `"sync"` \| `"async"` \| `"exit"` | packages/core/dist/contracts/checkpoint-store.d.ts:35 |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` | packages/core/dist/contracts/checkpoint-store.d.ts:36 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/core/dist/contracts/checkpoint-store.d.ts:38 |
