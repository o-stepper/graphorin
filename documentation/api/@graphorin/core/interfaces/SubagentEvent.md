[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SubagentEvent

# Interface: SubagentEvent

Defined in: packages/core/src/types/agent-event.ts:81

**`Stable`**

A CHILD sub-agent's event forwarded into the parent stream,
wrapped so it never aliases the parent's own step/run events. Which
child events forward is governed by the `forwardEvents` policy on
the handoff entry / `AgentToToolOptions` (default `'lifecycle'`).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentname"></a> `agentName` | `readonly` | `string` | The child agent's configured name. | packages/core/src/types/agent-event.ts:86 |
| <a id="property-event"></a> `event` | `readonly` | [`AgentEvent`](/api/@graphorin/core/type-aliases/AgentEvent.md)\&lt;`unknown`\&gt; | The child's event, verbatim. | packages/core/src/types/agent-event.ts:88 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | The PARENT-side toolCallId of the handoff / sub-agent call. | packages/core/src/types/agent-event.ts:84 |
| <a id="property-type"></a> `type` | `readonly` | `"subagent.event"` | - | packages/core/src/types/agent-event.ts:82 |
