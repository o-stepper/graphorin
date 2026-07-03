[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorStateRow

# Interface: ConsolidatorStateRow

Defined in: packages/memory/src/internal/storage-adapter.ts:351

Persisted per-scope consolidator state row mirrored byte-for-byte
by `@graphorin/store-sqlite`'s `consolidator_state` table. The lock
fields (`activeLockHeldBy` / `activeLockAcquiredAt`) are populated
while a phase is running and cleared when it finishes; the cursor
fields advance as the standard phase processes a batch of
messages.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:358 |
| <a id="property-activelockheldby"></a> `activeLockHeldBy` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:357 |
| <a id="property-lastcompletedat"></a> `lastCompletedAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:355 |
| <a id="property-lastphase"></a> `lastPhase` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:354 |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:353 |
| <a id="property-nexteligibleat"></a> `nextEligibleAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:356 |
| <a id="property-reflectionwatermark"></a> `reflectionWatermark` | `readonly` | `number` \| `null` | `ended_at` (epoch ms) of the newest episode the deep-phase reflection pass has already reflected on (MCON-13). A later pass accumulates importance only from strictly-newer episodes; `null` ⇒ nothing reflected yet. | packages/memory/src/internal/storage-adapter.ts:365 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/internal/storage-adapter.ts:352 |
