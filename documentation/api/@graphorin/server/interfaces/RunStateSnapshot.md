[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunStateSnapshot

# Interface: RunStateSnapshot

Defined in: [packages/server/src/runtime/run-state.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L76)

Snapshot returned by [RunStateTracker.snapshot](/api/@graphorin/server/classes/RunStateTracker.md#snapshot).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | [packages/server/src/runtime/run-state.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L83) |
| <a id="property-completedat"></a> `completedAt?` | `readonly` | `number` | [packages/server/src/runtime/run-state.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L81) |
| <a id="property-error"></a> `error?` | `readonly` | \{ `code?`: `string`; `hint?`: `string`; `message`: `string`; \} | [packages/server/src/runtime/run-state.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L82) |
| `error.code?` | `readonly` | `string` | [packages/server/src/runtime/run-state.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L82) |
| `error.hint?` | `readonly` | `string` | [packages/server/src/runtime/run-state.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L82) |
| `error.message` | `readonly` | `string` | [packages/server/src/runtime/run-state.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L82) |
| <a id="property-kind"></a> `kind` | `readonly` | `RunKind` | [packages/server/src/runtime/run-state.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L78) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/server/src/runtime/run-state.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L77) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | [packages/server/src/runtime/run-state.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L86) |
| <a id="property-startedat"></a> `startedAt?` | `readonly` | `number` | [packages/server/src/runtime/run-state.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L80) |
| <a id="property-status"></a> `status` | `readonly` | [`RunStatus`](/api/@graphorin/server/type-aliases/RunStatus.md) | [packages/server/src/runtime/run-state.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L79) |
| <a id="property-threadid"></a> `threadId?` | `readonly` | `string` | [packages/server/src/runtime/run-state.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L85) |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | [packages/server/src/runtime/run-state.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L87) |
| <a id="property-workflowid"></a> `workflowId?` | `readonly` | `string` | [packages/server/src/runtime/run-state.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/run-state.ts#L84) |
