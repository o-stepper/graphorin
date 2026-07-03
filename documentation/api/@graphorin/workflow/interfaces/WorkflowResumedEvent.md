[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowResumedEvent

# Interface: WorkflowResumedEvent\&lt;TState\&gt;

Defined in: packages/core/dist/types/workflow-event.d.ts:74

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | `TState` | packages/core/dist/types/workflow-event.d.ts:78 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/dist/types/workflow-event.d.ts:77 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | packages/core/dist/types/workflow-event.d.ts:76 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.resumed"` | packages/core/dist/types/workflow-event.d.ts:75 |
