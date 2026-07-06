[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionMessageWithMetadata

# Interface: SessionMessageWithMetadata

Defined in: packages/core/src/contracts/memory-store.ts:88

A stored message paired with its persisted identity (RP-5). The [Message](/api/@graphorin/core/type-aliases/Message.md)
type itself carries no id / timestamp; these come from the store row, so an
exporter can preserve message identity + chronology across a round-trip.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | packages/core/src/contracts/memory-store.ts:92 |
| <a id="property-message"></a> `message` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) | packages/core/src/contracts/memory-store.ts:89 |
| <a id="property-messageid"></a> `messageId` | `readonly` | `string` | packages/core/src/contracts/memory-store.ts:90 |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | packages/core/src/contracts/memory-store.ts:91 |
