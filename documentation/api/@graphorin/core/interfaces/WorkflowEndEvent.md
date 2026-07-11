[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowEndEvent

# Interface: WorkflowEndEvent\&lt;TState\&gt;

Defined in: [packages/core/src/types/workflow-event.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L109)

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | `TState` | [packages/core/src/types/workflow-event.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L112) |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | [packages/core/src/types/workflow-event.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L111) |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.end"` | [packages/core/src/types/workflow-event.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L110) |
