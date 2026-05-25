[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunStateSnapshot

# Interface: RunStateSnapshot

Defined in: packages/server/src/runtime/run-state.ts:39

Snapshot returned by [RunStateTracker.snapshot](/api/@graphorin/server/classes/RunStateTracker.md#snapshot).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:46 |
| <a id="property-completedat"></a> `completedAt?` | `readonly` | `number` | packages/server/src/runtime/run-state.ts:44 |
| <a id="property-error"></a> `error?` | `readonly` | \{ `message`: `string`; \} | packages/server/src/runtime/run-state.ts:45 |
| `error.message` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:45 |
| <a id="property-kind"></a> `kind` | `readonly` | `RunKind` | packages/server/src/runtime/run-state.ts:41 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:40 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:49 |
| <a id="property-startedat"></a> `startedAt?` | `readonly` | `number` | packages/server/src/runtime/run-state.ts:43 |
| <a id="property-status"></a> `status` | `readonly` | [`RunStatus`](/api/@graphorin/server/type-aliases/RunStatus.md) | packages/server/src/runtime/run-state.ts:42 |
| <a id="property-threadid"></a> `threadId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:48 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:50 |
| <a id="property-workflowid"></a> `workflowId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:47 |
