[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentFanOutMergedEvent

# Interface: AgentFanOutMergedEvent

Defined in: [packages/core/src/types/agent-event.ts:420](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L420)

Emitted when the fan-out merge step completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:424](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L424) |
| <a id="property-childcount"></a> `childCount` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:426](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L426) |
| <a id="property-childmetadata"></a> `childMetadata` | `readonly` | readonly [`FanOutChildMetadata`](/api/@graphorin/core/interfaces/FanOutChildMetadata.md)[] | [packages/core/src/types/agent-event.ts:430](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L430) |
| <a id="property-fanoutid"></a> `fanOutId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:425](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L425) |
| <a id="property-mergedurationms"></a> `mergeDurationMs` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:429](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L429) |
| <a id="property-mergestrategykind"></a> `mergeStrategyKind` | `readonly` | `"concat"` \| `"first-success"` \| `"judge-merge"` \| `"custom"` | [packages/core/src/types/agent-event.ts:428](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L428) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:422](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L422) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:423](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L423) |
| <a id="property-successfulchildcount"></a> `successfulChildCount` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:427](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L427) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.fanout.merged"` | [packages/core/src/types/agent-event.ts:421](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L421) |
