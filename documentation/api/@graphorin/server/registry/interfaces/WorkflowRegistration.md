[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / WorkflowRegistration

# Interface: WorkflowRegistration

Defined in: packages/server/src/registry/index.ts:151

Registration descriptor accepted by [WorkflowRegistry.register](/api/@graphorin/server/registry/classes/WorkflowRegistry.md#register).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | packages/server/src/registry/index.ts:154 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/server/src/registry/index.ts:152 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/server/src/registry/index.ts:155 |
| <a id="property-workflow"></a> `workflow` | `readonly` | [`ServerWorkflowLike`](/api/@graphorin/server/registry/interfaces/ServerWorkflowLike.md) | packages/server/src/registry/index.ts:153 |
