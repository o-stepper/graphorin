[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DlqBatchInput

# Interface: DlqBatchInput

Defined in: [packages/memory/src/internal/storage-adapter.ts:508](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L508)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:510](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L510) |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:513](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L513) |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:514](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L514) |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:515](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L515) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:509](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L509) |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | [packages/memory/src/internal/storage-adapter.ts:512](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L512) |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:516](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L516) |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed (MCON-10) so `drainDlq` replays the SAME phase instead of inferring (the old inference hard-coded `'standard'`). Absent / `null` ⇒ legacy row, replayed as `'standard'`. | [packages/memory/src/internal/storage-adapter.ts:523](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L523) |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:517](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L517) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | [packages/memory/src/internal/storage-adapter.ts:511](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L511) |
