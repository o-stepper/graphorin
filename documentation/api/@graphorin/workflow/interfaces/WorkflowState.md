[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowState

# Interface: WorkflowState\&lt;TState\&gt;

Defined in: [packages/workflow/src/types.ts:363](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L363)

Snapshot returned by [Workflow.getState](/api/@graphorin/workflow/interfaces/Workflow.md#getstate). Combines the most
recent checkpoint state with the high-level run status / pending
pause payload.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-checkpointid"></a> `checkpointId` | `readonly` | `string` | - | [packages/workflow/src/types.ts:368](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L368) |
| <a id="property-pendingpause"></a> `pendingPause?` | `readonly` | [`PendingPauseRecord`](/api/@graphorin/workflow/interfaces/PendingPauseRecord.md) | Carries the value passed to `pause(value)` when status is `suspended`. | [packages/workflow/src/types.ts:370](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L370) |
| <a id="property-pendingpauses"></a> `pendingPauses?` | `readonly` | readonly [`PendingPauseRecord`](/api/@graphorin/workflow/interfaces/PendingPauseRecord.md)[] | The FULL pending-pause set from the persisted frontier (D1) - parallel pausers, durable timers (`wakeAt`), awakeables and approvals (`name`) included. `pendingPause` remains the first entry for backwards compatibility. | [packages/workflow/src/types.ts:377](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L377) |
| <a id="property-state"></a> `state` | `readonly` | `TState` | - | [packages/workflow/src/types.ts:367](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L367) |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | - | [packages/workflow/src/types.ts:366](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L366) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | [packages/workflow/src/types.ts:365](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L365) |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | - | [packages/workflow/src/types.ts:364](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L364) |
