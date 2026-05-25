[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorStateRow

# Interface: ConsolidatorStateRow

Defined in: packages/memory/src/internal/storage-adapter.ts:303

Persisted per-scope consolidator state row mirrored byte-for-byte
by `@graphorin/store-sqlite`'s `consolidator_state` table. The lock
fields (`activeLockHeldBy` / `activeLockAcquiredAt`) are populated
while a phase is running and cleared when it finishes; the cursor
fields advance as the standard phase processes a batch of
messages.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:310 |
| <a id="property-activelockheldby"></a> `activeLockHeldBy` | `readonly` | `string` \| `null` | packages/memory/src/internal/storage-adapter.ts:309 |
| <a id="property-lastcompletedat"></a> `lastCompletedAt` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:307 |
| <a id="property-lastphase"></a> `lastPhase` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | packages/memory/src/internal/storage-adapter.ts:306 |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId` | `readonly` | `string` \| `null` | packages/memory/src/internal/storage-adapter.ts:305 |
| <a id="property-nexteligibleat"></a> `nextEligibleAt` | `readonly` | `number` \| `null` | packages/memory/src/internal/storage-adapter.ts:308 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/memory/src/internal/storage-adapter.ts:304 |
