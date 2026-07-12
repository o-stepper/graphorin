[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorStateRow

# Interface: ConsolidatorStateRow

Defined in: [packages/memory/src/internal/storage-adapter.ts:393](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L393)

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
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:400](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L400) |
| <a id="property-activelockheldby"></a> `activeLockHeldBy` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:399](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L399) |
| <a id="property-lastcompletedat"></a> `lastCompletedAt` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:397](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L397) |
| <a id="property-lastphase"></a> `lastPhase` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:396](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L396) |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:395](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L395) |
| <a id="property-nexteligibleat"></a> `nextEligibleAt` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:398](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L398) |
| <a id="property-reflectionwatermark"></a> `reflectionWatermark` | `readonly` | `number` \| `null` | `ended_at` (epoch ms) of the newest episode the deep-phase reflection pass has already reflected on (MCON-13). A later pass accumulates importance only from strictly-newer episodes; `null` ⇒ nothing reflected yet. | [packages/memory/src/internal/storage-adapter.ts:407](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L407) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | [packages/memory/src/internal/storage-adapter.ts:394](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L394) |
