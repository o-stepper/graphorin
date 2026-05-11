[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentResult

# Interface: AgentResult\&lt;TOutput\&gt;

Defined in: packages/core/src/types/agent-event.ts:489

Final result of an agent run, carried by the `agent.end` event.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `string` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` | packages/core/src/types/agent-event.ts:490 |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | packages/core/src/types/agent-event.ts:491 |
