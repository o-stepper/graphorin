[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunStateSnapshot

# Interface: RunStateSnapshot

Defined in: packages/server/src/runtime/run-state.ts:80

**`Stable`**

Snapshot returned by [RunStateTracker.snapshot](/api/@graphorin/server/classes/RunStateTracker.md#snapshot).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:87 |
| <a id="property-completedat"></a> `completedAt?` | `readonly` | `number` | packages/server/src/runtime/run-state.ts:85 |
| <a id="property-error"></a> `error?` | `readonly` | \{ `code?`: `string`; `hint?`: `string`; `message`: `string`; \} | packages/server/src/runtime/run-state.ts:86 |
| `error.code?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:86 |
| `error.hint?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:86 |
| `error.message` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:86 |
| <a id="property-kind"></a> `kind` | `readonly` | [`RunKind`](/api/@graphorin/server/type-aliases/RunKind.md) | packages/server/src/runtime/run-state.ts:82 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:81 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:90 |
| <a id="property-startedat"></a> `startedAt?` | `readonly` | `number` | packages/server/src/runtime/run-state.ts:84 |
| <a id="property-status"></a> `status` | `readonly` | [`RunStatus`](/api/@graphorin/server/type-aliases/RunStatus.md) | packages/server/src/runtime/run-state.ts:83 |
| <a id="property-threadid"></a> `threadId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:89 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:91 |
| <a id="property-workflowid"></a> `workflowId?` | `readonly` | `string` | packages/server/src/runtime/run-state.ts:88 |
