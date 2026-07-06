[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / SerializedPendingSubRun

# Interface: SerializedPendingSubRun

Defined in: packages/agent/src/run-state/index.ts:95

Serialized twin of core's `PendingSubRun` (W-001): the parked child
state travels as its own versioned [SerializedRunState](/api/@graphorin/agent/run-state/interfaces/SerializedRunState.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | [`SerializedRunState`](/api/@graphorin/agent/run-state/interfaces/SerializedRunState.md) | packages/agent/src/run-state/index.ts:99 |
| <a id="property-targetagentname"></a> `targetAgentName` | `readonly` | `string` | packages/agent/src/run-state/index.ts:98 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | packages/agent/src/run-state/index.ts:96 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/agent/src/run-state/index.ts:97 |
