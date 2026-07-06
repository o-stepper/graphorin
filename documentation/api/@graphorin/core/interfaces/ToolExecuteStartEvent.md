[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolExecuteStartEvent

# Interface: ToolExecuteStartEvent

Defined in: packages/core/src/types/agent-event.ts:143

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/agent-event.ts:145 |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | Convenience duplicate of the executing tool's name (W-049). Correlation within a tool lifecycle is by `toolCallId`; this field spares direct subscribers a stateful join back to the `tool.call.start` that carried the name. Optional for wire compatibility; the agent runtime always fills it. | packages/core/src/types/agent-event.ts:153 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.execute.start"` | - | packages/core/src/types/agent-event.ts:144 |
