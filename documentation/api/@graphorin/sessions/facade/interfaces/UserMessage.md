[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / UserMessage

# Interface: UserMessage

Defined in: [packages/core/dist/types/message.d.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts#L137)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | \| `string` \| readonly [`MessageContent`](/api/@graphorin/sessions/facade/type-aliases/MessageContent.md)[] | - | [packages/core/dist/types/message.d.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts#L139) |
| <a id="property-role"></a> `role` | `readonly` | `"user"` | - | [packages/core/dist/types/message.d.ts:138](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts#L138) |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | Multi-agent attribution: which user persona this came from, if any. | [packages/core/dist/types/message.d.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts#L141) |
