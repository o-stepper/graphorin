[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolError

# Interface: ToolError

Defined in: packages/core/src/types/tool.ts:205

The unsuccessful outcome of a tool invocation. The model sees a textual
representation of `message`; the runtime sees the typed shape.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `readonly` | `unknown` | Optional underlying cause (chained errors). | packages/core/src/types/tool.ts:211 |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | Optional remediation hint for human readers. | packages/core/src/types/tool.ts:213 |
| <a id="property-kind"></a> `kind` | `readonly` | [`ToolErrorKind`](/api/@graphorin/core/type-aliases/ToolErrorKind.md) | - | packages/core/src/types/tool.ts:208 |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | packages/core/src/types/tool.ts:209 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/tool.ts:206 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/core/src/types/tool.ts:207 |
