[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PendingWrite

# Interface: PendingWrite

Defined in: [packages/core/src/contracts/checkpoint-store.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L87)

Per-task pending write. Captured when a task in an execution step
succeeds while a sibling task fails: the next resume attempt skips the
already-completed work.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channel"></a> `channel` | `readonly` | `string` | - | [packages/core/src/contracts/checkpoint-store.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L90) |
| <a id="property-index"></a> `index` | `readonly` | `number` | - | [packages/core/src/contracts/checkpoint-store.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L89) |
| <a id="property-taskid"></a> `taskId` | `readonly` | `string` | - | [packages/core/src/contracts/checkpoint-store.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L88) |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | Serialized value blob - adapter-specific encoding. | [packages/core/src/contracts/checkpoint-store.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L92) |
