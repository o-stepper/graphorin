[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolCall

# Interface: ToolCall

Defined in: packages/core/src/types/tool.ts:154

A single tool invocation produced by an LLM. The runtime hands these to
the tool executor for parallel dispatch.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | Validated input matching the tool's `inputSchema`. | packages/core/src/types/tool.ts:160 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | Stable identifier the model uses to correlate input and output. | packages/core/src/types/tool.ts:156 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | Tool name as registered in the `ToolRegistry`. | packages/core/src/types/tool.ts:158 |
