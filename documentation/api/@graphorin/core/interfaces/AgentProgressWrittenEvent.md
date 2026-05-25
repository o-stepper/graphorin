[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentProgressWrittenEvent

# Interface: AgentProgressWrittenEvent

Defined in: packages/core/src/types/agent-event.ts:418

Emitted after `agent.progress.write(...)` completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:422 |
| <a id="property-ref"></a> `ref` | `readonly` | [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md) | packages/core/src/types/agent-event.ts:423 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:420 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:421 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.progress.written"` | packages/core/src/types/agent-event.ts:419 |
