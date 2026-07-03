[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolError

# Interface: ToolError

Defined in: packages/core/src/types/tool.ts:243

The unsuccessful outcome of a tool invocation. The model sees a textual
representation of `message`; the runtime sees the typed shape.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `readonly` | `unknown` | Optional underlying cause (chained errors). | packages/core/src/types/tool.ts:249 |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | Optional remediation hint for human readers. | packages/core/src/types/tool.ts:251 |
| <a id="property-kind"></a> `kind` | `readonly` | [`ToolErrorKind`](/api/@graphorin/core/type-aliases/ToolErrorKind.md) | - | packages/core/src/types/tool.ts:246 |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | packages/core/src/types/tool.ts:247 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/tool.ts:244 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/core/src/types/tool.ts:245 |
