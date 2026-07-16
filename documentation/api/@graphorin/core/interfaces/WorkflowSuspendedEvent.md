[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowSuspendedEvent

# Interface: WorkflowSuspendedEvent\&lt;TState\&gt;

Defined in: [packages/core/src/types/workflow-event.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L92)

Workflow paused - for HITL approvals or programmatic `pause(value)`
calls. Carries the value passed to `pause(...)` so the caller can
choose how to surface the prompt to the user.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | `TState` | [packages/core/src/types/workflow-event.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L96) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/src/types/workflow-event.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L95) |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | [packages/core/src/types/workflow-event.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L94) |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.suspended"` | [packages/core/src/types/workflow-event.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L93) |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | [packages/core/src/types/workflow-event.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L97) |
