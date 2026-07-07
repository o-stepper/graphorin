[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentFollowUpQueuedEvent

# Interface: AgentFollowUpQueuedEvent

Defined in: [packages/core/src/types/agent-event.ts:342](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L342)

Emitted when `agent.followUp(...)` queues a follow-up turn to fire
after the current turn completes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:344](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L344) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.followup.queued"` | [packages/core/src/types/agent-event.ts:343](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L343) |
