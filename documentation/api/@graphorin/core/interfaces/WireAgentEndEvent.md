[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireAgentEndEvent

# Interface: WireAgentEndEvent\&lt;TOutput\&gt;

Defined in: [packages/core/src/types/agent-event-wire.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event-wire.ts#L58)

Wire twin of [AgentEndEvent](/api/@graphorin/core/interfaces/AgentEndEvent.md): `result.state` is the JSON-safe
[WireRunState](/api/@graphorin/core/type-aliases/WireRunState.md) projection.

## Stable

## Extends

- `Omit`\<[`AgentEndEvent`](/api/@graphorin/core/interfaces/AgentEndEvent.md)\&lt;`TOutput`\&gt;, `"result"`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `string` |

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-result"></a> `result` | `readonly` | `Omit`\<[`AgentResult`](/api/@graphorin/core/interfaces/AgentResult.md)\&lt;`TOutput`\&gt;, `"state"`\> & \{ `state`: [`WireRunState`](/api/@graphorin/core/type-aliases/WireRunState.md); \} | - | [packages/core/src/types/agent-event-wire.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event-wire.ts#L60) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | `Omit.runId` | [packages/core/src/types/agent-event.ts:322](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L322) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.end"` | `Omit.type` | [packages/core/src/types/agent-event.ts:321](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L321) |
