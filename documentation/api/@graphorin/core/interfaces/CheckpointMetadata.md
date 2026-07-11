[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CheckpointMetadata

# Interface: CheckpointMetadata

Defined in: [packages/core/src/contracts/checkpoint-store.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L35)

Metadata associated with a checkpoint write. Adapters store this in a
sidecar table for efficient listing.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-nodename"></a> `nodeName?` | `readonly` | `string` | - | [packages/core/src/contracts/checkpoint-store.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L44) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | Session this checkpoint's state belongs to, when known (W-005). The agent runtime stamps it on every HITL-suspend write so a session hard-delete can cascade into `workflow_checkpoints` / `workflow_pending_writes` without parsing the opaque state blob. Optional and additive: third-party stores may ignore it, but any store that also implements `SessionStoreExt.deleteSession` should use it to honour the full erasure contract. | [packages/core/src/contracts/checkpoint-store.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L55) |
| <a id="property-source"></a> `source` | `readonly` | `"sync"` \| `"exit"` | Durability mode that produced this write. The legacy `'async'` value was removed (workflow-14 / WF-7 - it was byte-identical to `'sync'`); adapters normalize legacy persisted rows to `'sync'` at read time. | [packages/core/src/contracts/checkpoint-store.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L42) |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | - | [packages/core/src/contracts/checkpoint-store.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L43) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | [packages/core/src/contracts/checkpoint-store.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L45) |
| <a id="property-wakeat"></a> `wakeAt?` | `readonly` | `number` | W-032: earliest due durable timer among this checkpoint's frontier pauses (epoch ms). The workflow engine stamps it on every `suspended` write whose frontier holds a timer, so a store's [CheckpointStore.listSuspended](/api/@graphorin/core/interfaces/CheckpointStore.md#listsuspended) can enumerate due threads without parsing the opaque tags. Absent on non-timer suspends and on checkpoints written before the field existed - such threads need one manual `tick` (or a resume) to become driver-visible. | [packages/core/src/contracts/checkpoint-store.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L65) |
