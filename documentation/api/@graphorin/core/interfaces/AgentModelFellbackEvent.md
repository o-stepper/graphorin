[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentModelFellbackEvent

# Interface: AgentModelFellbackEvent

Defined in: [packages/core/src/types/agent-event.ts:380](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L380)

Emitted exactly once per agent-level model-fallback transition.
Identifies the failed primary, the next model in
`Agent.fallbackModels`, the eligible reason taxonomy, the
1-based step number and the 1-based attempt index within the step.

The event fires BEFORE the new model's stream starts so that
observers see the transition before any of the new model's
subsequent events flow.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:384](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L384) |
| <a id="property-attempt"></a> `attempt` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:389](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L389) |
| <a id="property-from"></a> `from` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:385](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L385) |
| <a id="property-reason"></a> `reason` | `readonly` | `"rate-limit"` \| `"capacity"` \| `"context-length"` \| `"transient"` | [packages/core/src/types/agent-event.ts:387](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L387) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:382](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L382) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:383](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L383) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:388](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L388) |
| <a id="property-to"></a> `to` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:386](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L386) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.model.fellback"` | [packages/core/src/types/agent-event.ts:381](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L381) |
