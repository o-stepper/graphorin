[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / PendingWrite

# Interface: PendingWrite

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L84)

Per-task pending write. Captured when a task in an execution step
succeeds while a sibling task fails: the next resume attempt skips the
already-completed work.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channel"></a> `channel` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L87) |
| <a id="property-index"></a> `index` | `readonly` | `number` | - | [packages/core/dist/contracts/checkpoint-store.d.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L86) |
| <a id="property-taskid"></a> `taskId` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L85) |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | Serialized value blob - adapter-specific encoding. | [packages/core/dist/contracts/checkpoint-store.d.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L89) |
