[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentModelFellbackEvent

# Interface: AgentModelFellbackEvent

Defined in: [packages/core/src/types/agent-event.ts:373](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L373)

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
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:377](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L377) |
| <a id="property-attempt"></a> `attempt` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:382](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L382) |
| <a id="property-from"></a> `from` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:378](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L378) |
| <a id="property-reason"></a> `reason` | `readonly` | `"rate-limit"` \| `"capacity"` \| `"context-length"` \| `"transient"` | [packages/core/src/types/agent-event.ts:380](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L380) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:375](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L375) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:376](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L376) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:381](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L381) |
| <a id="property-to"></a> `to` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:379](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L379) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.model.fellback"` | [packages/core/src/types/agent-event.ts:374](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L374) |
