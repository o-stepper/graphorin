[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireUserMessage

# Interface: WireUserMessage

Defined in: [packages/core/src/utils/binary-json.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L90)

Wire twin of [UserMessage](/api/@graphorin/core/interfaces/UserMessage.md).

## Stable

## Extends

- `Omit`\&lt;[`UserMessage`](/api/@graphorin/core/interfaces/UserMessage.md), `"content"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | \| `string` \| readonly [`WireMessageContent`](/api/@graphorin/core/type-aliases/WireMessageContent.md)[] | - | - | [packages/core/src/utils/binary-json.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L91) |
| <a id="property-role"></a> `role` | `readonly` | `"user"` | - | [`UserMessage`](/api/@graphorin/core/interfaces/UserMessage.md).[`role`](/api/@graphorin/core/interfaces/UserMessage.md#property-role) | [packages/core/src/types/message.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L151) |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | Multi-agent attribution: which user persona this came from, if any. | [`UserMessage`](/api/@graphorin/core/interfaces/UserMessage.md).[`userId`](/api/@graphorin/core/interfaces/UserMessage.md#property-userid) | [packages/core/src/types/message.ts:154](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L154) |
