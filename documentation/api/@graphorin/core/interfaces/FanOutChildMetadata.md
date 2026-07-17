[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / FanOutChildMetadata

# Interface: FanOutChildMetadata

Defined in: [packages/core/src/types/agent-event.ts:414](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L414)

Per-child result entry surfaced on
[AgentFanOutMergedEvent.childMetadata](/api/@graphorin/core/interfaces/AgentFanOutMergedEvent.md#property-childmetadata).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:415](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L415) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:419](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L419) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"cancelled"` \| `"budget-exceeded"` | [packages/core/src/types/agent-event.ts:416](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L416) |
| <a id="property-tokensused"></a> `tokensUsed` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:417](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L417) |
| <a id="property-toolcallcount"></a> `toolCallCount` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:418](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L418) |
