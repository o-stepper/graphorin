[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / ConsolidatorStateRow

# Interface: ConsolidatorStateRow

Defined in: packages/store-sqlite/src/consolidator-store.ts:23

Persisted state row mirrored byte-for-byte by
`@graphorin/memory`'s `ConsolidatorStateRow`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt` | `readonly` | `number` \| `null` | packages/store-sqlite/src/consolidator-store.ts:30 |
| <a id="property-activelockheldby"></a> `activeLockHeldBy` | `readonly` | `string` \| `null` | packages/store-sqlite/src/consolidator-store.ts:29 |
| <a id="property-lastcompletedat"></a> `lastCompletedAt` | `readonly` | `number` \| `null` | packages/store-sqlite/src/consolidator-store.ts:27 |
| <a id="property-lastphase"></a> `lastPhase` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | packages/store-sqlite/src/consolidator-store.ts:26 |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId` | `readonly` | `string` \| `null` | packages/store-sqlite/src/consolidator-store.ts:25 |
| <a id="property-nexteligibleat"></a> `nextEligibleAt` | `readonly` | `number` \| `null` | packages/store-sqlite/src/consolidator-store.ts:28 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/store-sqlite/src/consolidator-store.ts:24 |
