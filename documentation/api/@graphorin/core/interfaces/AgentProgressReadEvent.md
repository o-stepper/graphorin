[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentProgressReadEvent

# Interface: AgentProgressReadEvent

Defined in: packages/core/src/types/agent-event.ts:456

Emitted after `agent.progress.read(...)` completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:460 |
| <a id="property-queriedrole"></a> `queriedRole` | `readonly` | `string` \| `undefined` | packages/core/src/types/agent-event.ts:463 |
| <a id="property-queriedrunid"></a> `queriedRunId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:462 |
| <a id="property-refs"></a> `refs` | `readonly` | readonly [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md)[] | packages/core/src/types/agent-event.ts:461 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:458 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:459 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.progress.read"` | packages/core/src/types/agent-event.ts:457 |
