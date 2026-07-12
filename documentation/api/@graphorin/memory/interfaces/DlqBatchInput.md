[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DlqBatchInput

# Interface: DlqBatchInput

Defined in: [packages/memory/src/internal/storage-adapter.ts:473](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L473)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:475](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L475) |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:478](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L478) |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:479](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L479) |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:480](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L480) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:474](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L474) |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | [packages/memory/src/internal/storage-adapter.ts:477](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L477) |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:481](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L481) |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed (MCON-10) so `drainDlq` replays the SAME phase instead of inferring (the old inference hard-coded `'standard'`). Absent / `null` ⇒ legacy row, replayed as `'standard'`. | [packages/memory/src/internal/storage-adapter.ts:488](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L488) |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:482](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L482) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | [packages/memory/src/internal/storage-adapter.ts:476](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L476) |
