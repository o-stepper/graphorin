[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PruneThreadsOptions

# Interface: PruneThreadsOptions

Defined in: packages/core/src/contracts/checkpoint-store.ts:205

**`Stable`**

Options for [CheckpointStoreExt.pruneThreads](/api/@graphorin/core/interfaces/CheckpointStoreExt.md#prunethreads).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-beforeepochms"></a> `beforeEpochMs` | `readonly` | `number` | Cutoff: a `(threadId, namespace)` pair qualifies when its LATEST checkpoint (by `stepNumber`) was created before this epoch-ms instant. | packages/core/src/contracts/checkpoint-store.ts:211 |
| <a id="property-onlyterminal"></a> `onlyTerminal?` | `readonly` | `boolean` | When `true` (the default), only pairs whose latest checkpoint has a terminal status (`completed` / `failed` / `aborted`) are pruned - suspended threads hold live HITL approvals / awakeables and must survive a retention sweep. Set to `false` for a hard age-based sweep that also removes suspended threads. | packages/core/src/contracts/checkpoint-store.ts:219 |
