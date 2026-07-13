[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / AwakeableRef

# Interface: AwakeableRef

Defined in: [packages/workflow/src/awakeable-ref.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/awakeable-ref.ts#L21)

Address triple of a pending awakeable / approval.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | Caller-chosen awakeable / approval name inside the thread. | [packages/workflow/src/awakeable-ref.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/awakeable-ref.ts#L26) |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | - | [packages/workflow/src/awakeable-ref.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/awakeable-ref.ts#L24) |
| <a id="property-workflowid"></a> `workflowId` | `readonly` | `string` | Workflow id/name the thread belongs to (the REST path segment). | [packages/workflow/src/awakeable-ref.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/awakeable-ref.ts#L23) |
