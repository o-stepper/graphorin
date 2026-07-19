[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentFanOutSpawnedEvent

# Interface: AgentFanOutSpawnedEvent

Defined in: packages/core/src/types/agent-event.ts:397

**`Stable`**

Emitted when `Agent.fanOut(...)` begins to spawn its sub-agents.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:401 |
| <a id="property-childcount"></a> `childCount` | `readonly` | `number` | packages/core/src/types/agent-event.ts:403 |
| <a id="property-fanoutid"></a> `fanOutId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:402 |
| <a id="property-mergestrategykind"></a> `mergeStrategyKind` | `readonly` | `"concat"` \| `"first-success"` \| `"judge-merge"` \| `"custom"` | packages/core/src/types/agent-event.ts:404 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:399 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:400 |
| <a id="property-spawnedatiso"></a> `spawnedAtIso` | `readonly` | `string` | packages/core/src/types/agent-event.ts:405 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.fanout.spawned"` | packages/core/src/types/agent-event.ts:398 |
