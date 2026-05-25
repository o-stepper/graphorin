[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DlqBatchRow

# Interface: DlqBatchRow

Defined in: packages/memory/src/internal/storage-adapter.ts:376

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | packages/memory/src/internal/storage-adapter.ts:378 |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:381 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:382 |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | packages/memory/src/internal/storage-adapter.ts:383 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:377 |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | packages/memory/src/internal/storage-adapter.ts:380 |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:384 |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | packages/memory/src/internal/storage-adapter.ts:385 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/memory/src/internal/storage-adapter.ts:379 |
