[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentProgressWrittenEvent

# Interface: AgentProgressWrittenEvent

Defined in: packages/core/src/types/agent-event.ts:448

Emitted after `agent.progress.write(...)` completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:452 |
| <a id="property-ref"></a> `ref` | `readonly` | [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md) | packages/core/src/types/agent-event.ts:453 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:450 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:451 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.progress.written"` | packages/core/src/types/agent-event.ts:449 |
