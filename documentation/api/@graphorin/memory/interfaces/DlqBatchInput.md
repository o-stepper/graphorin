[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DlqBatchInput

# Interface: DlqBatchInput

Defined in: [packages/memory/src/internal/storage-adapter.ts:458](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L458)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:460](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L460) |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:463](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L463) |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:464](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L464) |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:465](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L465) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:459](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L459) |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | [packages/memory/src/internal/storage-adapter.ts:462](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L462) |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:466](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L466) |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed (MCON-10) so `drainDlq` replays the SAME phase instead of inferring (the old inference hard-coded `'standard'`). Absent / `null` ⇒ legacy row, replayed as `'standard'`. | [packages/memory/src/internal/storage-adapter.ts:473](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L473) |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:467](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L467) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | [packages/memory/src/internal/storage-adapter.ts:461](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L461) |
