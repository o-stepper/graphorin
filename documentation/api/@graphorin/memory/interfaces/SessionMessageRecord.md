[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionMessageRecord

# Interface: SessionMessageRecord

Defined in: [packages/memory/src/internal/storage-adapter.ts:231](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L231)

Single message tuple returned by
[SessionMemoryStoreExt.listMessagesSince](/api/@graphorin/memory/interfaces/SessionMemoryStoreExt.md#listmessagessince). The optional
`tokenCount` field is the value cached in the storage layer
(DEC-131); `null` indicates the cache is empty.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:234](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L234) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:232](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L232) |
| <a id="property-message"></a> `message` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) | - | [packages/memory/src/internal/storage-adapter.ts:236](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L236) |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:233](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L233) |
| <a id="property-tokencount"></a> `tokenCount` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:235](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L235) |
| <a id="property-verdict"></a> `verdict?` | `readonly` | [`RunTurnVerdict`](/api/@graphorin/core/interfaces/RunTurnVerdict.md) | B3 (item 15): the turn's persisted security verdict, when the run loop stamped one (`SessionMessagePushOptions.verdict`). Read by the memory ingest gate to exclude guardrail-blocked turns from extraction. Additive to the **Stable** tuple. | [packages/memory/src/internal/storage-adapter.ts:243](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L243) |
