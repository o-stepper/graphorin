[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowTaskEndEvent

# Interface: WorkflowTaskEndEvent

Defined in: [packages/core/dist/types/workflow-event.d.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L38)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | [packages/core/dist/types/workflow-event.d.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L44) |
| <a id="property-nodename"></a> `nodeName` | `readonly` | `string` | [packages/core/dist/types/workflow-event.d.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L42) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"paused"` | [packages/core/dist/types/workflow-event.d.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L43) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/dist/types/workflow-event.d.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L40) |
| <a id="property-taskid"></a> `taskId` | `readonly` | `string` | [packages/core/dist/types/workflow-event.d.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L41) |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.task.end"` | [packages/core/dist/types/workflow-event.d.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L39) |
