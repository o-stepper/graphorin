[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / UserMessage

# Interface: UserMessage

Defined in: packages/core/src/types/message.ts:150

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | \| `string` \| readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] | - | packages/core/src/types/message.ts:152 |
| <a id="property-role"></a> `role` | `readonly` | `"user"` | - | packages/core/src/types/message.ts:151 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | Multi-agent attribution: which user persona this came from, if any. | packages/core/src/types/message.ts:154 |
