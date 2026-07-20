[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentFollowUpQueuedEvent

# Interface: AgentFollowUpQueuedEvent

Defined in: packages/core/src/types/agent-event.ts:373

**`Stable`**

Emitted when `agent.followUp(...)` queues a follow-up turn to fire
after the current turn completes.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:375 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.followup.queued"` | packages/core/src/types/agent-event.ts:374 |
