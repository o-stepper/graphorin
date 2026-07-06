[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DlqBatchRow

# Interface: DlqBatchRow

Defined in: packages/memory/src/internal/storage-adapter.ts:477

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:479 |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:482 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:483 |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:484 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:478 |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | packages/memory/src/internal/storage-adapter.ts:481 |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:485 |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed (MCON-10); `null`/absent ⇒ legacy row. | packages/memory/src/internal/storage-adapter.ts:488 |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:486 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/internal/storage-adapter.ts:480 |
