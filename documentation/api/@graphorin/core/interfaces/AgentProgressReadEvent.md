[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentProgressReadEvent

# Interface: AgentProgressReadEvent

Defined in: packages/core/src/types/agent-event.ts:431

Emitted after `agent.progress.read(...)` completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:435 |
| <a id="property-queriedrole"></a> `queriedRole` | `readonly` | `string` \| `undefined` | packages/core/src/types/agent-event.ts:438 |
| <a id="property-queriedrunid"></a> `queriedRunId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:437 |
| <a id="property-refs"></a> `refs` | `readonly` | readonly [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md)[] | packages/core/src/types/agent-event.ts:436 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:433 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:434 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.progress.read"` | packages/core/src/types/agent-event.ts:432 |
