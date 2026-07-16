[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / ConsolidatorRunInput

# Interface: ConsolidatorRunInput

Defined in: [packages/store-sqlite/src/consolidator-store.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L52)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/store-sqlite/src/consolidator-store.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L53) |
| <a id="property-phase"></a> `phase` | `readonly` | `"light"` \| `"standard"` \| `"deep"` | [packages/store-sqlite/src/consolidator-store.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L56) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | [packages/store-sqlite/src/consolidator-store.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L54) |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `number` | [packages/store-sqlite/src/consolidator-store.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L57) |
| <a id="property-triggerkind"></a> `triggerKind` | `readonly` | `"turn"` \| `"idle"` \| `"cron"` \| `"event"` \| `"budget"` \| `"buffer"` \| `"manual"` | [packages/store-sqlite/src/consolidator-store.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L55) |
