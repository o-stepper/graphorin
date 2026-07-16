[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentFanOutMergedEvent

# Interface: AgentFanOutMergedEvent

Defined in: [packages/core/src/types/agent-event.ts:427](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L427)

Emitted when the fan-out merge step completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:431](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L431) |
| <a id="property-childcount"></a> `childCount` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:433](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L433) |
| <a id="property-childmetadata"></a> `childMetadata` | `readonly` | readonly [`FanOutChildMetadata`](/api/@graphorin/core/interfaces/FanOutChildMetadata.md)[] | [packages/core/src/types/agent-event.ts:437](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L437) |
| <a id="property-fanoutid"></a> `fanOutId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:432](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L432) |
| <a id="property-mergedurationms"></a> `mergeDurationMs` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:436](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L436) |
| <a id="property-mergestrategykind"></a> `mergeStrategyKind` | `readonly` | `"concat"` \| `"first-success"` \| `"judge-merge"` \| `"custom"` | [packages/core/src/types/agent-event.ts:435](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L435) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:429](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L429) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:430](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L430) |
| <a id="property-successfulchildcount"></a> `successfulChildCount` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:434](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L434) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.fanout.merged"` | [packages/core/src/types/agent-event.ts:428](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L428) |
