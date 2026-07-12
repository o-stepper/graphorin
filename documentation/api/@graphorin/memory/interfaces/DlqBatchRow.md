[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DlqBatchRow

# Interface: DlqBatchRow

Defined in: [packages/memory/src/internal/storage-adapter.ts:484](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L484)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:486](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L486) |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:489](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L489) |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:490](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L490) |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:491](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L491) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:485](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L485) |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | [packages/memory/src/internal/storage-adapter.ts:488](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L488) |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:492](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L492) |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed (MCON-10); `null`/absent ⇒ legacy row. | [packages/memory/src/internal/storage-adapter.ts:495](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L495) |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:493](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L493) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | [packages/memory/src/internal/storage-adapter.ts:487](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L487) |
