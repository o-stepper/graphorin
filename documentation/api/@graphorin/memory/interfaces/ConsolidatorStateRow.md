[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorStateRow

# Interface: ConsolidatorStateRow

Defined in: packages/memory/src/internal/storage-adapter.ts:436

**`Stable`**

Persisted per-scope consolidator state row mirrored byte-for-byte
by `@graphorin/store-sqlite`'s `consolidator_state` table. The lock
fields (`activeLockHeldBy` / `activeLockAcquiredAt`) are populated
while a phase is running and cleared when it finishes; the cursor
fields advance as the standard phase processes a batch of
messages.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:443 |
| <a id="property-activelockheldby"></a> `activeLockHeldBy` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:442 |
| <a id="property-lastcompletedat"></a> `lastCompletedAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:440 |
| <a id="property-lastphase"></a> `lastPhase` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:439 |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:438 |
| <a id="property-nexteligibleat"></a> `nextEligibleAt` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:441 |
| <a id="property-reflectionwatermark"></a> `reflectionWatermark` | `readonly` | `number` \| `null` | `ended_at` (epoch ms) of the newest episode the deep-phase reflection pass has already reflected on. A later pass accumulates importance only from strictly-newer episodes; `null` ⇒ nothing reflected yet. | packages/memory/src/internal/storage-adapter.ts:450 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/internal/storage-adapter.ts:437 |
