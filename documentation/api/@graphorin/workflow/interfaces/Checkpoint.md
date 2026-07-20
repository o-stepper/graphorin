[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Checkpoint

# Interface: Checkpoint

Defined in: [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts)

**`Stable`**

Serialized snapshot of workflow state, written after every execution
step.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channelversions"></a> `channelVersions` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Per-channel monotonic versions used by the workflow scheduler. | [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts) |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts) |
| <a id="property-namespace"></a> `namespace` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts) |
| <a id="property-parentid"></a> `parentId?` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts) |
| <a id="property-state"></a> `state` | `readonly` | `unknown` | Serialized state blob - adapter-specific encoding (JSON / superjson / …). | [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts) |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | - | [packages/core/dist/contracts/checkpoint-store.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/checkpoint-store.d.ts) |
