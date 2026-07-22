[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEndEvent

# Interface: AgentEndEvent\&lt;TOutput\&gt;

Defined in: packages/core/src/types/agent-event.ts:344

**`Stable`**

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `string` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-result"></a> `result` | `readonly` | [`AgentResult`](/api/@graphorin/core/interfaces/AgentResult.md)\&lt;`TOutput`\&gt; | packages/core/src/types/agent-event.ts:347 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:346 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.end"` | packages/core/src/types/agent-event.ts:345 |
