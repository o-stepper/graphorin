[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEndEvent

# Interface: AgentEndEvent\&lt;TOutput\&gt;

Defined in: [packages/core/src/types/agent-event.ts:313](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L313)

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `string` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-result"></a> `result` | `readonly` | [`AgentResult`](/api/@graphorin/core/interfaces/AgentResult.md)\&lt;`TOutput`\&gt; | [packages/core/src/types/agent-event.ts:316](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L316) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:315](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L315) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.end"` | [packages/core/src/types/agent-event.ts:314](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L314) |
