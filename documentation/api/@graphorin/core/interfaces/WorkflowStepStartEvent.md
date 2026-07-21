[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowStepStartEvent

# Interface: WorkflowStepStartEvent\&lt;TState\&gt;

Defined in: packages/core/src/types/workflow-event.ts:32

**`Stable`**

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | `TState` | packages/core/src/types/workflow-event.ts:35 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/src/types/workflow-event.ts:34 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.step.start"` | packages/core/src/types/workflow-event.ts:33 |
