[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DlqBatchInput

# Interface: DlqBatchInput

Defined in: packages/memory/src/internal/storage-adapter.ts:435

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:437 |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:440 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:441 |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:442 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:436 |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | packages/memory/src/internal/storage-adapter.ts:439 |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:443 |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed (MCON-10) so `drainDlq` replays the SAME phase instead of inferring (the old inference hard-coded `'standard'`). Absent / `null` ⇒ legacy row, replayed as `'standard'`. | packages/memory/src/internal/storage-adapter.ts:450 |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:444 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/internal/storage-adapter.ts:438 |
