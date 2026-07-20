[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolResult

# Interface: ToolResult\&lt;TOutput\&gt;

Defined in: packages/core/src/types/tool.ts:162

**`Stable`**

The successful outcome of a tool invocation, returned to the model.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-contentparts"></a> `contentParts?` | `readonly` | readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] | Optional content parts to append to the conversation (images, files, etc.). Tools that emit binary results use this field instead of trying to encode the binary into `output`. | packages/core/src/types/tool.ts:171 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | packages/core/src/types/tool.ts:172 |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` | - | packages/core/src/types/tool.ts:165 |
| <a id="property-resulthandle"></a> `resultHandle?` | `readonly` | [`ResultHandle`](/api/@graphorin/core/interfaces/ResultHandle.md) | Set when the tool's output was large enough to be stored behind a handle (the `'spill-to-file'` truncation strategy, or - later - an MCP `resource_link`) instead of being inlined in full. The runtime inlines only the bounded [ResultHandle.preview](/api/@graphorin/core/interfaces/ResultHandle.md#property-preview) and lets the model fetch the rest on demand via the built-in `read_result` tool. Absent for results that were inlined directly. | packages/core/src/types/tool.ts:181 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/tool.ts:163 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/core/src/types/tool.ts:164 |
