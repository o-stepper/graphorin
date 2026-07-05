[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / FanOutChildMetadata

# Interface: FanOutChildMetadata

Defined in: packages/core/src/types/agent-event.ts:363

Per-child result entry surfaced on
[AgentFanOutMergedEvent.childMetadata](/api/@graphorin/core/interfaces/AgentFanOutMergedEvent.md#property-childmetadata).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:364 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/core/src/types/agent-event.ts:368 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"cancelled"` \| `"budget-exceeded"` | packages/core/src/types/agent-event.ts:365 |
| <a id="property-tokensused"></a> `tokensUsed` | `readonly` | `number` | packages/core/src/types/agent-event.ts:366 |
| <a id="property-toolcallcount"></a> `toolCallCount` | `readonly` | `number` | packages/core/src/types/agent-event.ts:367 |
