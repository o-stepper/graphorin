[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowState

# Interface: WorkflowState\&lt;TState\&gt;

Defined in: packages/workflow/src/types.ts:353

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
| <a id="property-checkpointid"></a> `checkpointId` | `readonly` | `string` | - | packages/workflow/src/types.ts:358 |
| <a id="property-pendingpause"></a> `pendingPause?` | `readonly` | [`PendingPauseRecord`](/api/@graphorin/workflow/interfaces/PendingPauseRecord.md) | Carries the value passed to `pause(value)` when status is `suspended`. | packages/workflow/src/types.ts:360 |
| <a id="property-pendingpauses"></a> `pendingPauses?` | `readonly` | readonly [`PendingPauseRecord`](/api/@graphorin/workflow/interfaces/PendingPauseRecord.md)[] | The FULL pending-pause set from the persisted frontier (D1) - parallel pausers, durable timers (`wakeAt`), awakeables and approvals (`name`) included. `pendingPause` remains the first entry for backwards compatibility. | packages/workflow/src/types.ts:367 |
| <a id="property-state"></a> `state` | `readonly` | `TState` | - | packages/workflow/src/types.ts:357 |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | - | packages/workflow/src/types.ts:356 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/workflow/src/types.ts:355 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | - | packages/workflow/src/types.ts:354 |
