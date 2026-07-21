[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireUserMessage

# Interface: WireUserMessage

Defined in: packages/core/src/utils/binary-json.ts:93

**`Stable`**

Wire twin of [UserMessage](/api/@graphorin/core/interfaces/UserMessage.md).

## Extends

- `Omit`\&lt;[`UserMessage`](/api/@graphorin/core/interfaces/UserMessage.md), `"content"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | \| `string` \| readonly [`WireMessageContent`](/api/@graphorin/core/type-aliases/WireMessageContent.md)[] | - | - | packages/core/src/utils/binary-json.ts:94 |
| <a id="property-role"></a> `role` | `readonly` | `"user"` | - | [`UserMessage`](/api/@graphorin/core/interfaces/UserMessage.md).[`role`](/api/@graphorin/core/interfaces/UserMessage.md#property-role) | packages/core/src/types/message.ts:151 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | Multi-agent attribution: which user persona this came from, if any. | [`UserMessage`](/api/@graphorin/core/interfaces/UserMessage.md).[`userId`](/api/@graphorin/core/interfaces/UserMessage.md#property-userid) | packages/core/src/types/message.ts:154 |
