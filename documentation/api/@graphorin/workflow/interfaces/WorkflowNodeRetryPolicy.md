[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowNodeRetryPolicy

# Interface: WorkflowNodeRetryPolicy

Defined in: [packages/workflow/src/types.ts:192](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L192)

Bounded retry policy for a workflow node (D1 / workflow-03).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-backoffms"></a> `backoffMs?` | `readonly` | `number` | Base backoff in ms, doubling per retry. Default 250. | [packages/workflow/src/types.ts:196](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L196) |
| <a id="property-maxattempts"></a> `maxAttempts?` | `readonly` | `number` | Total attempts including the first (clamped to >= 1). Default 1. | [packages/workflow/src/types.ts:194](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L194) |
