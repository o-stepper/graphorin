[**Graphorin API reference v0.11.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / UserMessage

# Interface: UserMessage

Defined in: [packages/core/dist/types/message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | \| `string` \| readonly [`MessageContent`](/api/@graphorin/sessions/facade/type-aliases/MessageContent.md)[] | - | [packages/core/dist/types/message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts) |
| <a id="property-role"></a> `role` | `readonly` | `"user"` | - | [packages/core/dist/types/message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts) |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | Multi-agent attribution: which user persona this came from, if any. | [packages/core/dist/types/message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts) |
