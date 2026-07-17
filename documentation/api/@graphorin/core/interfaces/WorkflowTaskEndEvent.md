[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowTaskEndEvent

# Interface: WorkflowTaskEndEvent

Defined in: [packages/core/src/types/workflow-event.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L54)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | [packages/core/src/types/workflow-event.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L60) |
| <a id="property-nodename"></a> `nodeName` | `readonly` | `string` | [packages/core/src/types/workflow-event.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L58) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"paused"` | [packages/core/src/types/workflow-event.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L59) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/src/types/workflow-event.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L56) |
| <a id="property-taskid"></a> `taskId` | `readonly` | `string` | [packages/core/src/types/workflow-event.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L57) |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.task.end"` | [packages/core/src/types/workflow-event.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L55) |
