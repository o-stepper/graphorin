[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecuteErrorEvent

# Interface: ToolExecuteErrorEvent

Defined in: packages/core/src/types/agent-event.ts:203

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-error"></a> `error` | `readonly` | [`ToolError`](/api/@graphorin/core/interfaces/ToolError.md) | - | packages/core/src/types/agent-event.ts:208 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/agent-event.ts:205 |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | See [ToolExecuteStartEvent.toolName](/api/@graphorin/core/interfaces/ToolExecuteStartEvent.md#property-toolname). | packages/core/src/types/agent-event.ts:207 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.error"` | - | packages/core/src/types/agent-event.ts:204 |
