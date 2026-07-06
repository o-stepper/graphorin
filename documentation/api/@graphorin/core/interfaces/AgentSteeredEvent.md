[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentSteeredEvent

# Interface: AgentSteeredEvent

Defined in: [packages/core/src/types/agent-event.ts:331](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L331)

Emitted when `agent.steer(...)` queues an intervention to flow into
the next provider call within the current run.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:333](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L333) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.steered"` | [packages/core/src/types/agent-event.ts:332](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L332) |
