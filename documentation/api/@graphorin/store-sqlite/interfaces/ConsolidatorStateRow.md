[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / ConsolidatorStateRow

# Interface: ConsolidatorStateRow

Defined in: [packages/store-sqlite/src/consolidator-store.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L23)

Persisted state row mirrored byte-for-byte by
`@graphorin/memory`'s `ConsolidatorStateRow`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activelockacquiredat"></a> `activeLockAcquiredAt` | `readonly` | `number` \| `null` | - | [packages/store-sqlite/src/consolidator-store.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L30) |
| <a id="property-activelockheldby"></a> `activeLockHeldBy` | `readonly` | `string` \| `null` | - | [packages/store-sqlite/src/consolidator-store.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L29) |
| <a id="property-lastcompletedat"></a> `lastCompletedAt` | `readonly` | `number` \| `null` | - | [packages/store-sqlite/src/consolidator-store.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L27) |
| <a id="property-lastphase"></a> `lastPhase` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | - | [packages/store-sqlite/src/consolidator-store.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L26) |
| <a id="property-lastprocessedmessageid"></a> `lastProcessedMessageId` | `readonly` | `string` \| `null` | - | [packages/store-sqlite/src/consolidator-store.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L25) |
| <a id="property-nexteligibleat"></a> `nextEligibleAt` | `readonly` | `number` \| `null` | - | [packages/store-sqlite/src/consolidator-store.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L28) |
| <a id="property-reflectionwatermark"></a> `reflectionWatermark` | `readonly` | `number` \| `null` | `ended_at` (epoch ms) of the newest episode the deep-phase reflection pass has already reflected on (MCON-13). A later pass accumulates importance only from strictly-newer episodes; `null` ⇒ nothing reflected yet. | [packages/store-sqlite/src/consolidator-store.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L37) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | [packages/store-sqlite/src/consolidator-store.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L24) |
