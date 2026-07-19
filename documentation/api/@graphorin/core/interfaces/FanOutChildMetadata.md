[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / FanOutChildMetadata

# Interface: FanOutChildMetadata

Defined in: packages/core/src/types/agent-event.ts:414

**`Stable`**

Per-child result entry surfaced on
[AgentFanOutMergedEvent.childMetadata](/api/@graphorin/core/interfaces/AgentFanOutMergedEvent.md#property-childmetadata).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:415 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/core/src/types/agent-event.ts:419 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"cancelled"` \| `"budget-exceeded"` | packages/core/src/types/agent-event.ts:416 |
| <a id="property-tokensused"></a> `tokensUsed` | `readonly` | `number` | packages/core/src/types/agent-event.ts:417 |
| <a id="property-toolcallcount"></a> `toolCallCount` | `readonly` | `number` | packages/core/src/types/agent-event.ts:418 |
