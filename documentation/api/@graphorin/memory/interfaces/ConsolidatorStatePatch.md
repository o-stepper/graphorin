[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorStatePatch

# Interface: ConsolidatorStatePatch

Defined in: [packages/memory/src/internal/storage-adapter.ts:412](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L412)

Patch shape accepted by
[ConsolidatorMemoryStoreExt.upsertState](/api/@graphorin/memory/interfaces/ConsolidatorMemoryStoreExt.md#upsertstate). Every field is
optional so callers may advance the cursor and the run stamp
independently. `null` clears a column; `undefined` leaves it
untouched.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:418](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L418) |
| <a id="property-activelockheldby"></a> `activeLockHeldBy?` | `readonly` | `string` \| `null` | [packages/memory/src/internal/storage-adapter.ts:417](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L417) |
| <a id="property-lastcompletedat"></a> `lastCompletedAt?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:415](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L415) |
| <a id="property-lastphase"></a> `lastPhase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | [packages/memory/src/internal/storage-adapter.ts:414](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L414) |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId?` | `readonly` | `string` \| `null` | [packages/memory/src/internal/storage-adapter.ts:413](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L413) |
| <a id="property-nexteligibleat"></a> `nextEligibleAt?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:416](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L416) |
| <a id="property-reflectionwatermark"></a> `reflectionWatermark?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:419](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L419) |
