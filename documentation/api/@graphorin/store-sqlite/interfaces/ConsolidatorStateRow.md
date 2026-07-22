[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / ConsolidatorStateRow

# Interface: ConsolidatorStateRow

Defined in: packages/store-sqlite/src/consolidator-store.ts:23

**`Stable`**

Persisted state row mirrored byte-for-byte by
`@graphorin/memory`'s `ConsolidatorStateRow`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt` | `readonly` | `number` \| `null` | - | packages/store-sqlite/src/consolidator-store.ts:30 |
| <a id="property-activelockheldby"></a> `activeLockHeldBy` | `readonly` | `string` \| `null` | - | packages/store-sqlite/src/consolidator-store.ts:29 |
| <a id="property-lastcompletedat"></a> `lastCompletedAt` | `readonly` | `number` \| `null` | - | packages/store-sqlite/src/consolidator-store.ts:27 |
| <a id="property-lastphase"></a> `lastPhase` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | - | packages/store-sqlite/src/consolidator-store.ts:26 |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId` | `readonly` | `string` \| `null` | - | packages/store-sqlite/src/consolidator-store.ts:25 |
| <a id="property-nexteligibleat"></a> `nextEligibleAt` | `readonly` | `number` \| `null` | - | packages/store-sqlite/src/consolidator-store.ts:28 |
| <a id="property-reflectionwatermark"></a> `reflectionWatermark` | `readonly` | `number` \| `null` | `ended_at` (epoch ms) of the newest episode the deep-phase reflection pass has already reflected on. A later pass accumulates importance only from strictly-newer episodes; `null` ⇒ nothing reflected yet. | packages/store-sqlite/src/consolidator-store.ts:37 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/store-sqlite/src/consolidator-store.ts:24 |
