[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointMetadata

# Interface: CheckpointMetadata

Defined in: packages/core/src/contracts/checkpoint-store.ts:35

Metadata associated with a checkpoint write. Adapters store this in a
sidecar table for efficient listing.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-nodename"></a> `nodeName?` | `readonly` | `string` | packages/core/src/contracts/checkpoint-store.ts:38 |
| <a id="property-source"></a> `source` | `readonly` | `"sync"` \| `"async"` \| `"exit"` | packages/core/src/contracts/checkpoint-store.ts:36 |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` | packages/core/src/contracts/checkpoint-store.ts:37 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/core/src/contracts/checkpoint-store.ts:39 |
