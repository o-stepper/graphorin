[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowStepStartEvent

# Interface: WorkflowStepStartEvent\&lt;TState\&gt;

Defined in: packages/core/dist/types/workflow-event.d.ts:19

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | `TState` | packages/core/dist/types/workflow-event.d.ts:22 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/dist/types/workflow-event.d.ts:21 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.step.start"` | packages/core/dist/types/workflow-event.d.ts:20 |
