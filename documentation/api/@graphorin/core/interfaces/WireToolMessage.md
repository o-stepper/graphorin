[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireToolMessage

# Interface: WireToolMessage

Defined in: packages/core/src/utils/binary-json.ts:103

**`Stable`**

Wire twin of [ToolMessage](/api/@graphorin/core/interfaces/ToolMessage.md).

## Extends

- `Omit`\&lt;[`ToolMessage`](/api/@graphorin/core/interfaces/ToolMessage.md), `"content"`\&gt;

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | \| `string` \| readonly [`WireMessageContent`](/api/@graphorin/core/type-aliases/WireMessageContent.md)[] | - | packages/core/src/utils/binary-json.ts:104 |
| <a id="property-role"></a> `role` | `readonly` | `"tool"` | [`ToolMessage`](/api/@graphorin/core/interfaces/ToolMessage.md).[`role`](/api/@graphorin/core/interfaces/ToolMessage.md#property-role) | packages/core/src/types/message.ts:171 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | [`ToolMessage`](/api/@graphorin/core/interfaces/ToolMessage.md).[`toolCallId`](/api/@graphorin/core/interfaces/ToolMessage.md#property-toolcallid) | packages/core/src/types/message.ts:172 |
