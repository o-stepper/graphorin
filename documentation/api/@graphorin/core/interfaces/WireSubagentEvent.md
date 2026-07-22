[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireSubagentEvent

# Interface: WireSubagentEvent

Defined in: packages/core/src/types/agent-event-wire.ts:81

**`Stable`**

Wire twin of [SubagentEvent](/api/@graphorin/core/interfaces/SubagentEvent.md): the wrapped child event
projects recursively - a forwarded child `agent.end` carries a full
`RunState` of its own.

## Extends

- `Omit`\&lt;[`SubagentEvent`](/api/@graphorin/core/interfaces/SubagentEvent.md), `"event"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentname"></a> `agentName` | `readonly` | `string` | The child agent's configured name. | [`SubagentEvent`](/api/@graphorin/core/interfaces/SubagentEvent.md).[`agentName`](/api/@graphorin/core/interfaces/SubagentEvent.md#property-agentname) | packages/core/src/types/agent-event.ts:86 |
| <a id="property-event"></a> `event` | `readonly` | [`WireAgentEvent`](/api/@graphorin/core/type-aliases/WireAgentEvent.md)\&lt;`unknown`\&gt; | - | - | packages/core/src/types/agent-event-wire.ts:82 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | The PARENT-side toolCallId of the handoff / sub-agent call. | [`SubagentEvent`](/api/@graphorin/core/interfaces/SubagentEvent.md).[`toolCallId`](/api/@graphorin/core/interfaces/SubagentEvent.md#property-toolcallid) | packages/core/src/types/agent-event.ts:84 |
| <a id="property-type"></a> `type` | `readonly` | `"subagent.event"` | - | [`SubagentEvent`](/api/@graphorin/core/interfaces/SubagentEvent.md).[`type`](/api/@graphorin/core/interfaces/SubagentEvent.md#property-type) | packages/core/src/types/agent-event.ts:82 |
