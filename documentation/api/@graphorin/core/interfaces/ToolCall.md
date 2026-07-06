[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolCall

# Interface: ToolCall

Defined in: [packages/core/src/types/tool-call.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool-call.ts#L17)

A single tool invocation the model requested, normalised by the
provider layer and handed to the tool executor for parallel dispatch.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | Validated input matching the tool's `inputSchema`. | [packages/core/src/types/tool-call.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool-call.ts#L23) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | Stable identifier the model uses to correlate input and output. | [packages/core/src/types/tool-call.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool-call.ts#L19) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | Tool name as registered in the `ToolRegistry`. | [packages/core/src/types/tool-call.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool-call.ts#L21) |
