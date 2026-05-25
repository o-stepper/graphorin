[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionMessageRecord

# Interface: SessionMessageRecord

Defined in: packages/memory/src/internal/storage-adapter.ts:132

Single message tuple returned by
[SessionMemoryStoreExt.listMessagesSince](/api/@graphorin/memory/interfaces/SessionMemoryStoreExt.md#listmessagessince). The optional
`tokenCount` field is the value cached in the storage layer
(DEC-131); `null` indicates the cache is empty.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:135 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:133 |
| <a id="property-message"></a> `message` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) | packages/memory/src/internal/storage-adapter.ts:137 |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | packages/memory/src/internal/storage-adapter.ts:134 |
| <a id="property-tokencount"></a> `tokenCount` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:136 |
