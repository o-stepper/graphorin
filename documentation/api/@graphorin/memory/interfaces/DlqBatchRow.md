[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DlqBatchRow

# Interface: DlqBatchRow

Defined in: packages/memory/src/internal/storage-adapter.ts:332

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | packages/memory/src/internal/storage-adapter.ts:334 |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:337 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:338 |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | packages/memory/src/internal/storage-adapter.ts:339 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:333 |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | packages/memory/src/internal/storage-adapter.ts:336 |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:340 |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | packages/memory/src/internal/storage-adapter.ts:341 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/memory/src/internal/storage-adapter.ts:335 |
