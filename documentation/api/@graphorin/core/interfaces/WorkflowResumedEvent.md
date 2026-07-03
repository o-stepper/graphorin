[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowResumedEvent

# Interface: WorkflowResumedEvent\&lt;TState\&gt;

Defined in: packages/core/src/types/workflow-event.ts:94

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | `TState` | packages/core/src/types/workflow-event.ts:98 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/src/types/workflow-event.ts:97 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | packages/core/src/types/workflow-event.ts:96 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.resumed"` | packages/core/src/types/workflow-event.ts:95 |
