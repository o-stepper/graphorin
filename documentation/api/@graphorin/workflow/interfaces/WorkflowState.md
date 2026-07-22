[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowState

# Interface: WorkflowState\&lt;TState\&gt;

Defined in: packages/workflow/src/types.ts:362

**`Stable`**

Snapshot returned by [Workflow.getState](/api/@graphorin/workflow/interfaces/Workflow.md#getstate). Combines the most
recent checkpoint state with the high-level run status / pending
pause payload.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-checkpointid"></a> `checkpointId` | `readonly` | `string` | - | packages/workflow/src/types.ts:367 |
| <a id="property-pendingpause"></a> `pendingPause?` | `readonly` | [`PendingPauseRecord`](/api/@graphorin/workflow/interfaces/PendingPauseRecord.md) | Carries the value passed to `pause(value)` when status is `suspended`. | packages/workflow/src/types.ts:369 |
| <a id="property-pendingpauses"></a> `pendingPauses?` | `readonly` | readonly [`PendingPauseRecord`](/api/@graphorin/workflow/interfaces/PendingPauseRecord.md)[] | The FULL pending-pause set from the persisted frontier - parallel pausers, durable timers (`wakeAt`), awakeables and approvals (`name`) included. `pendingPause` remains the first entry for backwards compatibility. | packages/workflow/src/types.ts:376 |
| <a id="property-state"></a> `state` | `readonly` | `TState` | - | packages/workflow/src/types.ts:366 |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | - | packages/workflow/src/types.ts:365 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/workflow/src/types.ts:364 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | - | packages/workflow/src/types.ts:363 |
