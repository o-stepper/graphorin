[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunStateSnapshot

# Interface: RunStateSnapshot

Defined in: packages/server/src/runtime/run-state.ts:67

Snapshot returned by [RunStateTracker.snapshot](/api/@graphorin/server/classes/RunStateTracker.md#snapshot).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:74 |
| <a id="property-completedat"></a> `completedAt?` | `readonly` | `number` | packages/server/src/runtime/run-state.ts:72 |
| <a id="property-error"></a> `error?` | `readonly` | \{ `code?`: `string`; `hint?`: `string`; `message`: `string`; \} | packages/server/src/runtime/run-state.ts:73 |
| `error.code?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:73 |
| `error.hint?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:73 |
| `error.message` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:73 |
| <a id="property-kind"></a> `kind` | `readonly` | `RunKind` | packages/server/src/runtime/run-state.ts:69 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:68 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:77 |
| <a id="property-startedat"></a> `startedAt?` | `readonly` | `number` | packages/server/src/runtime/run-state.ts:71 |
| <a id="property-status"></a> `status` | `readonly` | [`RunStatus`](/api/@graphorin/server/type-aliases/RunStatus.md) | packages/server/src/runtime/run-state.ts:70 |
| <a id="property-threadid"></a> `threadId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:76 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:78 |
| <a id="property-workflowid"></a> `workflowId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:75 |
