[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowNodeRetryPolicy

# Interface: WorkflowNodeRetryPolicy

Defined in: packages/workflow/src/types.ts:192

Bounded retry policy for a workflow node (D1 / workflow-03).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-backoffms"></a> `backoffMs?` | `readonly` | `number` | Base backoff in ms, doubling per retry. Default 250. | packages/workflow/src/types.ts:196 |
| <a id="property-maxattempts"></a> `maxAttempts?` | `readonly` | `number` | Total attempts including the first (clamped to >= 1). Default 1. | packages/workflow/src/types.ts:194 |
