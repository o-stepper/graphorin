[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentFanOutMergedEvent

# Interface: AgentFanOutMergedEvent

Defined in: packages/core/src/types/agent-event.ts:351

Emitted when the fan-out merge step completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:355 |
| <a id="property-childcount"></a> `childCount` | `readonly` | `number` | packages/core/src/types/agent-event.ts:357 |
| <a id="property-childmetadata"></a> `childMetadata` | `readonly` | readonly [`FanOutChildMetadata`](/api/@graphorin/core/interfaces/FanOutChildMetadata.md)[] | packages/core/src/types/agent-event.ts:361 |
| <a id="property-fanoutid"></a> `fanOutId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:356 |
| <a id="property-mergedurationms"></a> `mergeDurationMs` | `readonly` | `number` | packages/core/src/types/agent-event.ts:360 |
| <a id="property-mergestrategykind"></a> `mergeStrategyKind` | `readonly` | `"concat"` \| `"first-success"` \| `"judge-merge"` \| `"custom"` | packages/core/src/types/agent-event.ts:359 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:353 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:354 |
| <a id="property-successfulchildcount"></a> `successfulChildCount` | `readonly` | `number` | packages/core/src/types/agent-event.ts:358 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.fanout.merged"` | packages/core/src/types/agent-event.ts:352 |
