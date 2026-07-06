[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentFanOutSpawnedEvent

# Interface: AgentFanOutSpawnedEvent

Defined in: [packages/core/src/types/agent-event.ts:390](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L390)

Emitted when `Agent.fanOut(...)` begins to spawn its sub-agents.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:394](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L394) |
| <a id="property-childcount"></a> `childCount` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:396](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L396) |
| <a id="property-fanoutid"></a> `fanOutId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:395](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L395) |
| <a id="property-mergestrategykind"></a> `mergeStrategyKind` | `readonly` | `"concat"` \| `"first-success"` \| `"judge-merge"` \| `"custom"` | [packages/core/src/types/agent-event.ts:397](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L397) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:392](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L392) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:393](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L393) |
| <a id="property-spawnedatiso"></a> `spawnedAtIso` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:398](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L398) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.fanout.spawned"` | [packages/core/src/types/agent-event.ts:391](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L391) |
