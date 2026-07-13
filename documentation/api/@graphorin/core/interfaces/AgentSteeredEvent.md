[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentSteeredEvent

# Interface: AgentSteeredEvent

Defined in: [packages/core/src/types/agent-event.ts:338](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L338)

Emitted when `agent.steer(...)` queues an intervention to flow into
the next provider call within the current run.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:340](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L340) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.steered"` | [packages/core/src/types/agent-event.ts:339](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L339) |
