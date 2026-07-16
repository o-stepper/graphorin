[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowStepEndEvent

# Interface: WorkflowStepEndEvent\&lt;TState\&gt;

Defined in: [packages/core/src/types/workflow-event.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L39)

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | `TState` | [packages/core/src/types/workflow-event.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L42) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/src/types/workflow-event.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L41) |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.step.end"` | [packages/core/src/types/workflow-event.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L40) |
