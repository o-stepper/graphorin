[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Checkpoint

# Interface: Checkpoint

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L16)

Serialized snapshot of workflow state, written after every execution
step.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channelversions"></a> `channelVersions` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Per-channel monotonic versions used by the workflow scheduler. | [packages/core/dist/contracts/checkpoint-store.d.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L24) |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L26) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L17) |
| <a id="property-namespace"></a> `namespace` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L19) |
| <a id="property-parentid"></a> `parentId?` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L20) |
| <a id="property-state"></a> `state` | `readonly` | `unknown` | Serialized state blob - adapter-specific encoding (JSON / superjson / …). | [packages/core/dist/contracts/checkpoint-store.d.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L22) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | [packages/core/dist/contracts/checkpoint-store.d.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L25) |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts#L18) |
