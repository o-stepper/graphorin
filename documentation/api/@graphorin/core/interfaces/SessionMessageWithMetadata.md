[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionMessageWithMetadata

# Interface: SessionMessageWithMetadata

Defined in: [packages/core/src/contracts/memory-store.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L101)

A stored message paired with its persisted identity (RP-5). The [Message](/api/@graphorin/core/type-aliases/Message.md)
type itself carries no id / timestamp; these come from the store row, so an
exporter can preserve message identity + chronology across a round-trip.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | [packages/core/src/contracts/memory-store.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L105) |
| <a id="property-message"></a> `message` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) | [packages/core/src/contracts/memory-store.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L102) |
| <a id="property-messageid"></a> `messageId` | `readonly` | `string` | [packages/core/src/contracts/memory-store.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L103) |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | [packages/core/src/contracts/memory-store.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L104) |
