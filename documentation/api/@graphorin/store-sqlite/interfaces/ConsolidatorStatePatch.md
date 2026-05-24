[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / ConsolidatorStatePatch

# Interface: ConsolidatorStatePatch

Defined in: packages/store-sqlite/src/consolidator-store.ts:34

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt?` | `readonly` | `number` \| `null` | packages/store-sqlite/src/consolidator-store.ts:40 |
| <a id="property-activelockheldby"></a> `activeLockHeldBy?` | `readonly` | `string` \| `null` | packages/store-sqlite/src/consolidator-store.ts:39 |
| <a id="property-lastcompletedat"></a> `lastCompletedAt?` | `readonly` | `number` \| `null` | packages/store-sqlite/src/consolidator-store.ts:37 |
| <a id="property-lastphase"></a> `lastPhase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | packages/store-sqlite/src/consolidator-store.ts:36 |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId?` | `readonly` | `string` \| `null` | packages/store-sqlite/src/consolidator-store.ts:35 |
| <a id="property-nexteligibleat"></a> `nextEligibleAt?` | `readonly` | `number` \| `null` | packages/store-sqlite/src/consolidator-store.ts:38 |
