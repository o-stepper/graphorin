[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecuteEndEvent

# Interface: ToolExecuteEndEvent

Defined in: packages/core/src/types/agent-event.ts:217

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | packages/core/src/types/agent-event.ts:223 |
| <a id="property-result"></a> `result` | `readonly` | `unknown` | - | packages/core/src/types/agent-event.ts:222 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/agent-event.ts:219 |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | See [ToolExecuteStartEvent.toolName](/api/@graphorin/core/interfaces/ToolExecuteStartEvent.md#property-toolname). | packages/core/src/types/agent-event.ts:221 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.end"` | - | packages/core/src/types/agent-event.ts:218 |
