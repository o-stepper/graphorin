[**Graphorin API reference v0.13.4**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / WorkflowRegistration

# Interface: WorkflowRegistration

Defined in: packages/server/src/registry/index.ts:187

**`Stable`**

Registration descriptor accepted by [WorkflowRegistry.register](/api/@graphorin/server/registry/classes/WorkflowRegistry.md#register).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | packages/server/src/registry/index.ts:190 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/server/src/registry/index.ts:188 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/server/src/registry/index.ts:191 |
| <a id="property-workflow"></a> `workflow` | `readonly` | [`ServerWorkflowLike`](/api/@graphorin/server/registry/interfaces/ServerWorkflowLike.md) | packages/server/src/registry/index.ts:189 |
