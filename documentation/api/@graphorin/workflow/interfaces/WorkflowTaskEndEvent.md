[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowTaskEndEvent

# Interface: WorkflowTaskEndEvent

Defined in: packages/core/dist/types/workflow-event.d.ts:38

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/core/dist/types/workflow-event.d.ts:44 |
| <a id="property-nodename"></a> `nodeName` | `readonly` | `string` | packages/core/dist/types/workflow-event.d.ts:42 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"paused"` | packages/core/dist/types/workflow-event.d.ts:43 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/dist/types/workflow-event.d.ts:40 |
| <a id="property-taskid"></a> `taskId` | `readonly` | `string` | packages/core/dist/types/workflow-event.d.ts:41 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.task.end"` | packages/core/dist/types/workflow-event.d.ts:39 |
