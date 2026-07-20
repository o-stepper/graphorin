[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolCall

# Interface: ToolCall

Defined in: packages/core/src/types/tool-call.ts:17

**`Stable`**

A single tool invocation the model requested, normalised by the
provider layer and handed to the tool executor for parallel dispatch.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | Validated input matching the tool's `inputSchema`. | packages/core/src/types/tool-call.ts:23 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | Stable identifier the model uses to correlate input and output. | packages/core/src/types/tool-call.ts:19 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | Tool name as registered in the `ToolRegistry`. | packages/core/src/types/tool-call.ts:21 |
