[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireToolMessage

# Interface: WireToolMessage

Defined in: [packages/core/src/utils/binary-json.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L100)

Wire twin of [ToolMessage](/api/@graphorin/core/interfaces/ToolMessage.md).

## Stable

## Extends

- `Omit`\&lt;[`ToolMessage`](/api/@graphorin/core/interfaces/ToolMessage.md), `"content"`\&gt;

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | \| `string` \| readonly [`WireMessageContent`](/api/@graphorin/core/type-aliases/WireMessageContent.md)[] | - | [packages/core/src/utils/binary-json.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L101) |
| <a id="property-role"></a> `role` | `readonly` | `"tool"` | [`ToolMessage`](/api/@graphorin/core/interfaces/ToolMessage.md).[`role`](/api/@graphorin/core/interfaces/ToolMessage.md#property-role) | [packages/core/src/types/message.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L171) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | [`ToolMessage`](/api/@graphorin/core/interfaces/ToolMessage.md).[`toolCallId`](/api/@graphorin/core/interfaces/ToolMessage.md#property-toolcallid) | [packages/core/src/types/message.ts:172](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L172) |
