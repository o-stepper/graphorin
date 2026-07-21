[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / ThreadInspection

# Interface: ThreadInspection

Defined in: packages/workflow/src/inspect.ts:19

**`Stable`**

Snapshot returned by [readThreadState](/api/@graphorin/workflow/functions/readThreadState.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-checkpointid"></a> `checkpointId` | `readonly` | `string` | - | packages/workflow/src/inspect.ts:23 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | packages/workflow/src/inspect.ts:25 |
| <a id="property-namespace"></a> `namespace` | `readonly` | `string` | - | packages/workflow/src/inspect.ts:21 |
| <a id="property-nodename"></a> `nodeName?` | `readonly` | `string` | Node the run last stopped in, when the store recorded one. | packages/workflow/src/inspect.ts:30 |
| <a id="property-pendingpauses"></a> `pendingPauses` | `readonly` | readonly [`PendingPauseRecord`](/api/@graphorin/workflow/interfaces/PendingPauseRecord.md)[] | Full pending-pause frontier: timers (`wakeAt`), awakeables/approvals (`name`). | packages/workflow/src/inspect.ts:32 |
| <a id="property-state"></a> `state` | `readonly` | `unknown` | The unwrapped channel record persisted at the latest checkpoint. | packages/workflow/src/inspect.ts:28 |
| <a id="property-status"></a> `status` | `readonly` | `"running"` \| `"suspended"` \| `"completed"` \| `"failed"` \| `"aborted"` | - | packages/workflow/src/inspect.ts:26 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/workflow/src/inspect.ts:24 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | - | packages/workflow/src/inspect.ts:22 |
| <a id="property-workflowname"></a> `workflowName` | `readonly` | `string` | - | packages/workflow/src/inspect.ts:20 |
