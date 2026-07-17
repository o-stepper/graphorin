[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Checkpoint

# Interface: Checkpoint

Defined in: [packages/core/src/contracts/checkpoint-store.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L16)

Serialized snapshot of workflow state, written after every execution
step.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channelversions"></a> `channelVersions` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Per-channel monotonic versions used by the workflow scheduler. | [packages/core/src/contracts/checkpoint-store.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L24) |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | [packages/core/src/contracts/checkpoint-store.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L26) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/core/src/contracts/checkpoint-store.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L17) |
| <a id="property-namespace"></a> `namespace` | `readonly` | `string` | - | [packages/core/src/contracts/checkpoint-store.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L19) |
| <a id="property-parentid"></a> `parentId?` | `readonly` | `string` | - | [packages/core/src/contracts/checkpoint-store.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L20) |
| <a id="property-state"></a> `state` | `readonly` | `unknown` | Serialized state blob - adapter-specific encoding (JSON / superjson / …). | [packages/core/src/contracts/checkpoint-store.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L22) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | [packages/core/src/contracts/checkpoint-store.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L25) |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | - | [packages/core/src/contracts/checkpoint-store.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/checkpoint-store.ts#L18) |
