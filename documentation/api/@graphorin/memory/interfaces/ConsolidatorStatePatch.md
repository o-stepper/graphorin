[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorStatePatch

# Interface: ConsolidatorStatePatch

Defined in: packages/memory/src/internal/storage-adapter.ts:462

**`Stable`**

Patch shape accepted by
[ConsolidatorMemoryStoreExt.upsertState](/api/@graphorin/memory/interfaces/ConsolidatorMemoryStoreExt.md#upsertstate). Every field is
optional so callers may advance the cursor and the run stamp
independently. `null` clears a column; `undefined` leaves it
untouched.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt?` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:468 |
| <a id="property-activelockheldby"></a> `activeLockHeldBy?` | `readonly` | `string` \| `null` | packages/memory/src/internal/storage-adapter.ts:467 |
| <a id="property-lastcompletedat"></a> `lastCompletedAt?` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:465 |
| <a id="property-lastphase"></a> `lastPhase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | packages/memory/src/internal/storage-adapter.ts:464 |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId?` | `readonly` | `string` \| `null` | packages/memory/src/internal/storage-adapter.ts:463 |
| <a id="property-nexteligibleat"></a> `nextEligibleAt?` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:466 |
| <a id="property-reflectionwatermark"></a> `reflectionWatermark?` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:469 |
