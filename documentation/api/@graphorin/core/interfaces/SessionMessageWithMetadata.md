[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionMessageWithMetadata

# Interface: SessionMessageWithMetadata

Defined in: [packages/core/src/contracts/memory-store.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L111)

A stored message paired with its persisted identity (RP-5). The [Message](/api/@graphorin/core/type-aliases/Message.md)
type itself carries no id / timestamp; these come from the store row, so an
exporter can preserve message identity + chronology across a round-trip.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | [packages/core/src/contracts/memory-store.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L115) |
| <a id="property-message"></a> `message` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) | [packages/core/src/contracts/memory-store.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L112) |
| <a id="property-messageid"></a> `messageId` | `readonly` | `string` | [packages/core/src/contracts/memory-store.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L113) |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | [packages/core/src/contracts/memory-store.ts:114](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/memory-store.ts#L114) |
