[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolResult

# Interface: ToolResult\&lt;TOutput\&gt;

Defined in: packages/core/src/types/tool.ts:161

The successful outcome of a tool invocation, returned to the model.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-contentparts"></a> `contentParts?` | `readonly` | readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] | Optional content parts to append to the conversation (images, files, etc.). Tools that emit binary results use this field instead of trying to encode the binary into `output`. | packages/core/src/types/tool.ts:170 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | packages/core/src/types/tool.ts:171 |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` | - | packages/core/src/types/tool.ts:164 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/tool.ts:162 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/core/src/types/tool.ts:163 |
