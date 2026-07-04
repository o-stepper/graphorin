[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointMetadata

# Interface: CheckpointMetadata

Defined in: packages/core/src/contracts/checkpoint-store.ts:35

Metadata associated with a checkpoint write. Adapters store this in a
sidecar table for efficient listing.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-nodename"></a> `nodeName?` | `readonly` | `string` | - | packages/core/src/contracts/checkpoint-store.ts:44 |
| <a id="property-source"></a> `source` | `readonly` | `"sync"` \| `"exit"` | Durability mode that produced this write. The legacy `'async'` value was removed (workflow-14 / WF-7 — it was byte-identical to `'sync'`); adapters normalize legacy persisted rows to `'sync'` at read time. | packages/core/src/contracts/checkpoint-store.ts:42 |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | - | packages/core/src/contracts/checkpoint-store.ts:43 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/core/src/contracts/checkpoint-store.ts:45 |
