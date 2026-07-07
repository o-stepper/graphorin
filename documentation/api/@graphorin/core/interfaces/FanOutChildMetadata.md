[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / FanOutChildMetadata

# Interface: FanOutChildMetadata

Defined in: [packages/core/src/types/agent-event.ts:407](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L407)

Per-child result entry surfaced on
[AgentFanOutMergedEvent.childMetadata](/api/@graphorin/core/interfaces/AgentFanOutMergedEvent.md#property-childmetadata).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:408](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L408) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:412](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L412) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"cancelled"` \| `"budget-exceeded"` | [packages/core/src/types/agent-event.ts:409](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L409) |
| <a id="property-tokensused"></a> `tokensUsed` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:410](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L410) |
| <a id="property-toolcallcount"></a> `toolCallCount` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:411](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L411) |
