[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / PendingWrite

# Interface: PendingWrite

Defined in: packages/core/dist/contracts/checkpoint-store.d.ts:64

Per-task pending write. Captured when a task in an execution step
succeeds while a sibling task fails: the next resume attempt skips the
already-completed work.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channel"></a> `channel` | `readonly` | `string` | - | packages/core/dist/contracts/checkpoint-store.d.ts:67 |
| <a id="property-index"></a> `index` | `readonly` | `number` | - | packages/core/dist/contracts/checkpoint-store.d.ts:66 |
| <a id="property-taskid"></a> `taskId` | `readonly` | `string` | - | packages/core/dist/contracts/checkpoint-store.d.ts:65 |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | Serialized value blob - adapter-specific encoding. | packages/core/dist/contracts/checkpoint-store.d.ts:69 |
