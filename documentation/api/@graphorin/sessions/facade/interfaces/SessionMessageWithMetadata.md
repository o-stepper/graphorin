[**Graphorin API reference v0.13.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / SessionMessageWithMetadata

# Interface: SessionMessageWithMetadata

Defined in: packages/sessions/src/facade.ts:119

**`Stable`**

A stored message paired with its persisted identity. The core
[Message](/api/@graphorin/core/type-aliases/Message.md) type carries no id / timestamp; these come from the store row.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | packages/sessions/src/facade.ts:123 |
| <a id="property-message"></a> `message` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) | packages/sessions/src/facade.ts:120 |
| <a id="property-messageid"></a> `messageId` | `readonly` | `string` | packages/sessions/src/facade.ts:121 |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | packages/sessions/src/facade.ts:122 |
