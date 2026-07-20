[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / ConsolidatorRunInput

# Interface: ConsolidatorRunInput

Defined in: packages/store-sqlite/src/consolidator-store.ts:52

**`Stable`**

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/store-sqlite/src/consolidator-store.ts:53 |
| <a id="property-phase"></a> `phase` | `readonly` | `"light"` \| `"standard"` \| `"deep"` | packages/store-sqlite/src/consolidator-store.ts:56 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/store-sqlite/src/consolidator-store.ts:54 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `number` | packages/store-sqlite/src/consolidator-store.ts:57 |
| <a id="property-triggerkind"></a> `triggerKind` | `readonly` | `"turn"` \| `"idle"` \| `"cron"` \| `"event"` \| `"budget"` \| `"buffer"` \| `"manual"` | packages/store-sqlite/src/consolidator-store.ts:55 |
