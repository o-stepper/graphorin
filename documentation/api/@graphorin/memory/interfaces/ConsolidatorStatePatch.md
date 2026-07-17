[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorStatePatch

# Interface: ConsolidatorStatePatch

Defined in: [packages/memory/src/internal/storage-adapter.ts:462](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L462)

Patch shape accepted by
[ConsolidatorMemoryStoreExt.upsertState](/api/@graphorin/memory/interfaces/ConsolidatorMemoryStoreExt.md#upsertstate). Every field is
optional so callers may advance the cursor and the run stamp
independently. `null` clears a column; `undefined` leaves it
untouched.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:468](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L468) |
| <a id="property-activelockheldby"></a> `activeLockHeldBy?` | `readonly` | `string` \| `null` | [packages/memory/src/internal/storage-adapter.ts:467](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L467) |
| <a id="property-lastcompletedat"></a> `lastCompletedAt?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:465](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L465) |
| <a id="property-lastphase"></a> `lastPhase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | [packages/memory/src/internal/storage-adapter.ts:464](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L464) |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId?` | `readonly` | `string` \| `null` | [packages/memory/src/internal/storage-adapter.ts:463](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L463) |
| <a id="property-nexteligibleat"></a> `nextEligibleAt?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:466](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L466) |
| <a id="property-reflectionwatermark"></a> `reflectionWatermark?` | `readonly` | `number` \| `null` | [packages/memory/src/internal/storage-adapter.ts:469](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L469) |
