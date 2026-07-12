[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DlqBatchRow

# Interface: DlqBatchRow

Defined in: [packages/memory/src/internal/storage-adapter.ts:492](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L492)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:494](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L494) |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:497](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L497) |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:498](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L498) |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:499](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L499) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:493](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L493) |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | [packages/memory/src/internal/storage-adapter.ts:496](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L496) |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:500](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L500) |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed (MCON-10); `null`/absent ⇒ legacy row. | [packages/memory/src/internal/storage-adapter.ts:503](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L503) |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:501](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L501) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | [packages/memory/src/internal/storage-adapter.ts:495](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L495) |
