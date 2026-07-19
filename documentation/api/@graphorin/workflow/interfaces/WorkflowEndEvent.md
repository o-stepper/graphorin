[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowEndEvent

# Interface: WorkflowEndEvent\&lt;TState\&gt;

Defined in: [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts)

**`Stable`**

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | `TState` | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.end"` | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
