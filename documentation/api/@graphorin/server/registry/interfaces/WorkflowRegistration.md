[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / WorkflowRegistration

# Interface: WorkflowRegistration

Defined in: [packages/server/src/registry/index.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L171)

Registration descriptor accepted by [WorkflowRegistry.register](/api/@graphorin/server/registry/classes/WorkflowRegistry.md#register).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | [packages/server/src/registry/index.ts:174](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L174) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/server/src/registry/index.ts:172](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L172) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | [packages/server/src/registry/index.ts:175](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L175) |
| <a id="property-workflow"></a> `workflow` | `readonly` | [`ServerWorkflowLike`](/api/@graphorin/server/registry/interfaces/ServerWorkflowLike.md) | [packages/server/src/registry/index.ts:173](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L173) |
