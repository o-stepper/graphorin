[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DlqBatchRow

# Interface: DlqBatchRow

Defined in: packages/memory/src/internal/storage-adapter.ts:527

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:529 |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:532 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:533 |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:534 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:528 |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | packages/memory/src/internal/storage-adapter.ts:531 |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:535 |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed; `null`/absent ⇒ legacy row. | packages/memory/src/internal/storage-adapter.ts:538 |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:536 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/internal/storage-adapter.ts:530 |
