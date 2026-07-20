[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecuteErrorEvent

# Interface: ToolExecuteErrorEvent

Defined in: packages/core/src/types/agent-event.ts:227

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-error"></a> `error` | `readonly` | [`ToolError`](/api/@graphorin/core/interfaces/ToolError.md) | - | packages/core/src/types/agent-event.ts:232 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/agent-event.ts:229 |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | See [ToolExecuteStartEvent.toolName](/api/@graphorin/core/interfaces/ToolExecuteStartEvent.md#property-toolname). | packages/core/src/types/agent-event.ts:231 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.error"` | - | packages/core/src/types/agent-event.ts:228 |
