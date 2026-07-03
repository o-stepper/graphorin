[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowEndEvent

# Interface: WorkflowEndEvent\&lt;TState\&gt;

Defined in: packages/core/src/types/workflow-event.ts:102

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | `TState` | packages/core/src/types/workflow-event.ts:105 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | packages/core/src/types/workflow-event.ts:104 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.end"` | packages/core/src/types/workflow-event.ts:103 |
