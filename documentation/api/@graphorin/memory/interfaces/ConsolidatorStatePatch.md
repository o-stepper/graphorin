[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorStatePatch

# Interface: ConsolidatorStatePatch

Defined in: [packages/memory/src/internal/storage-adapter.ts:427](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L427)

Patch shape accepted by
[ConsolidatorMemoryStoreExt.upsertState](/api/@graphorin/memory/interfaces/ConsolidatorMemoryStoreExt.md#upsertstate). Every field is
optional so callers may advance the cursor and the run stamp
independently. `null` clears a column; `undefined` leaves it
untouched.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:433](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L433) |
| <a id="property-activelockheldby"></a> `activeLockHeldBy?` | `readonly` | `string` \| `null` | [packages/memory/src/internal/storage-adapter.ts:432](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L432) |
| <a id="property-lastcompletedat"></a> `lastCompletedAt?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:430](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L430) |
| <a id="property-lastphase"></a> `lastPhase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | [packages/memory/src/internal/storage-adapter.ts:429](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L429) |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId?` | `readonly` | `string` \| `null` | [packages/memory/src/internal/storage-adapter.ts:428](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L428) |
| <a id="property-nexteligibleat"></a> `nextEligibleAt?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:431](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L431) |
| <a id="property-reflectionwatermark"></a> `reflectionWatermark?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:434](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L434) |
