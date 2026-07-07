[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionMessageRecord

# Interface: SessionMessageRecord

Defined in: [packages/memory/src/internal/storage-adapter.ts:195](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L195)

Single message tuple returned by
[SessionMemoryStoreExt.listMessagesSince](/api/@graphorin/memory/interfaces/SessionMemoryStoreExt.md#listmessagessince). The optional
`tokenCount` field is the value cached in the storage layer
(DEC-131); `null` indicates the cache is empty.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:198](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L198) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/memory/src/internal/storage-adapter.ts:196](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L196) |
| <a id="property-message"></a> `message` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) | [packages/memory/src/internal/storage-adapter.ts:200](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L200) |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | [packages/memory/src/internal/storage-adapter.ts:197](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L197) |
| <a id="property-tokencount"></a> `tokenCount` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:199](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L199) |
