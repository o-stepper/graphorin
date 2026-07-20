[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Checkpoint

# Interface: Checkpoint

Defined in: packages/core/src/contracts/checkpoint-store.ts:16

**`Stable`**

Serialized snapshot of workflow state, written after every execution
step.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channelversions"></a> `channelVersions` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Per-channel monotonic versions used by the workflow scheduler. | packages/core/src/contracts/checkpoint-store.ts:24 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | packages/core/src/contracts/checkpoint-store.ts:26 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/core/src/contracts/checkpoint-store.ts:17 |
| <a id="property-namespace"></a> `namespace` | `readonly` | `string` | - | packages/core/src/contracts/checkpoint-store.ts:19 |
| <a id="property-parentid"></a> `parentId?` | `readonly` | `string` | - | packages/core/src/contracts/checkpoint-store.ts:20 |
| <a id="property-state"></a> `state` | `readonly` | `unknown` | Serialized state blob - adapter-specific encoding (JSON / superjson / …). | packages/core/src/contracts/checkpoint-store.ts:22 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/core/src/contracts/checkpoint-store.ts:25 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | - | packages/core/src/contracts/checkpoint-store.ts:18 |
