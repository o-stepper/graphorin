[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentFanOutSpawnedEvent

# Interface: AgentFanOutSpawnedEvent

Defined in: packages/core/src/types/agent-event.ts:351

Emitted when `Agent.fanOut(...)` begins to spawn its sub-agents.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:355 |
| <a id="property-childcount"></a> `childCount` | `readonly` | `number` | packages/core/src/types/agent-event.ts:357 |
| <a id="property-fanoutid"></a> `fanOutId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:356 |
| <a id="property-mergestrategykind"></a> `mergeStrategyKind` | `readonly` | `"concat"` \| `"first-success"` \| `"judge-merge"` \| `"custom"` | packages/core/src/types/agent-event.ts:358 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:353 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:354 |
| <a id="property-spawnedatiso"></a> `spawnedAtIso` | `readonly` | `string` | packages/core/src/types/agent-event.ts:359 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.fanout.spawned"` | packages/core/src/types/agent-event.ts:352 |
