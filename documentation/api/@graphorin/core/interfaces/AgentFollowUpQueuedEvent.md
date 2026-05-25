[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentFollowUpQueuedEvent

# Interface: AgentFollowUpQueuedEvent

Defined in: packages/core/src/types/agent-event.ts:273

Emitted when `agent.followUp(...)` queues a follow-up turn to fire
after the current turn completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:275 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.followup.queued"` | packages/core/src/types/agent-event.ts:274 |
