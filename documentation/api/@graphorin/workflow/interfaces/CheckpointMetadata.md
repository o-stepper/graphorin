[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / CheckpointMetadata

# Interface: CheckpointMetadata

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:34

Metadata associated with a checkpoint write. Adapters store this in a
sidecar table for efficient listing.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-nodename"></a> `nodeName?` | `readonly` | `string` | - | packages/core/dist/contracts/checkpoint-store.d.ts:43 |
| <a id="property-source"></a> `source` | `readonly` | `"sync"` \| `"exit"` | Durability mode that produced this write. The legacy `'async'` value was removed (workflow-14 / WF-7 — it was byte-identical to `'sync'`); adapters normalize legacy persisted rows to `'sync'` at read time. | packages/core/dist/contracts/checkpoint-store.d.ts:41 |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | - | packages/core/dist/contracts/checkpoint-store.d.ts:42 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/core/dist/contracts/checkpoint-store.d.ts:44 |
