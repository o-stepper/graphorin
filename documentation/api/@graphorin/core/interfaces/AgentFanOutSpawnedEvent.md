[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentFanOutSpawnedEvent

# Interface: AgentFanOutSpawnedEvent

Defined in: packages/core/src/types/agent-event.ts:321

Emitted when `Agent.fanOut(...)` begins to spawn its sub-agents.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:325 |
| <a id="property-childcount"></a> `childCount` | `readonly` | `number` | packages/core/src/types/agent-event.ts:327 |
| <a id="property-fanoutid"></a> `fanOutId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:326 |
| <a id="property-mergestrategykind"></a> `mergeStrategyKind` | `readonly` | `"concat"` \| `"first-success"` \| `"judge-merge"` \| `"custom"` | packages/core/src/types/agent-event.ts:328 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:323 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:324 |
| <a id="property-spawnedatiso"></a> `spawnedAtIso` | `readonly` | `string` | packages/core/src/types/agent-event.ts:329 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.fanout.spawned"` | packages/core/src/types/agent-event.ts:322 |
