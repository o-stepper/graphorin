[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PendingWrite

# Interface: PendingWrite

Defined in: packages/core/src/contracts/checkpoint-store.ts:86

**`Stable`**

Per-task pending write. Captured when a task in an execution step
succeeds while a sibling task fails: the next resume attempt skips the
already-completed work.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channel"></a> `channel` | `readonly` | `string` | - | packages/core/src/contracts/checkpoint-store.ts:89 |
| <a id="property-index"></a> `index` | `readonly` | `number` | - | packages/core/src/contracts/checkpoint-store.ts:88 |
| <a id="property-taskid"></a> `taskId` | `readonly` | `string` | - | packages/core/src/contracts/checkpoint-store.ts:87 |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | Serialized value blob - adapter-specific encoding. | packages/core/src/contracts/checkpoint-store.ts:91 |
