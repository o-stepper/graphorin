[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentProgressReadEvent

# Interface: AgentProgressReadEvent

Defined in: packages/core/src/types/agent-event.ts:531

**`Stable`**

Emitted after `agent.progress.read(...)` completes.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:535 |
| <a id="property-queriedrole"></a> `queriedRole` | `readonly` | `string` \| `undefined` | packages/core/src/types/agent-event.ts:538 |
| <a id="property-queriedrunid"></a> `queriedRunId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:537 |
| <a id="property-refs"></a> `refs` | `readonly` | readonly [`ProgressArtifactRef`](/api/@graphorin/core/interfaces/ProgressArtifactRef.md)[] | packages/core/src/types/agent-event.ts:536 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:533 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:534 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.progress.read"` | packages/core/src/types/agent-event.ts:532 |
