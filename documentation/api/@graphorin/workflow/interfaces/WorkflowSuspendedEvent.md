[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowSuspendedEvent

# Interface: WorkflowSuspendedEvent\&lt;TState\&gt;

Defined in: packages/core/dist/types/workflow-event.d.ts:73

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
| <a id="property-state"></a> `state` | `readonly` | `TState` | packages/core/dist/types/workflow-event.d.ts:77 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/dist/types/workflow-event.d.ts:76 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | packages/core/dist/types/workflow-event.d.ts:75 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.suspended"` | packages/core/dist/types/workflow-event.d.ts:74 |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | packages/core/dist/types/workflow-event.d.ts:78 |
