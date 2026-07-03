[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionMessageRecord

# Interface: SessionMessageRecord

Defined in: packages/memory/src/internal/storage-adapter.ts:160

Single message tuple returned by
[SessionMemoryStoreExt.listMessagesSince](/api/@graphorin/memory/interfaces/SessionMemoryStoreExt.md#listmessagessince). The optional
`tokenCount` field is the value cached in the storage layer
(DEC-131); `null` indicates the cache is empty.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:163 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:161 |
| <a id="property-message"></a> `message` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) | packages/memory/src/internal/storage-adapter.ts:165 |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | packages/memory/src/internal/storage-adapter.ts:162 |
| <a id="property-tokencount"></a> `tokenCount` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:164 |
