[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / DlqBatchRow

# Interface: DlqBatchRow

Defined in: packages/store-sqlite/src/consolidator-store.ts:96

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | packages/store-sqlite/src/consolidator-store.ts:98 |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | packages/store-sqlite/src/consolidator-store.ts:101 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | packages/store-sqlite/src/consolidator-store.ts:102 |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | packages/store-sqlite/src/consolidator-store.ts:103 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/store-sqlite/src/consolidator-store.ts:97 |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | packages/store-sqlite/src/consolidator-store.ts:100 |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` \| `null` | - | packages/store-sqlite/src/consolidator-store.ts:104 |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed; `null` ⇒ legacy row. | packages/store-sqlite/src/consolidator-store.ts:107 |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | packages/store-sqlite/src/consolidator-store.ts:105 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/store-sqlite/src/consolidator-store.ts:99 |
