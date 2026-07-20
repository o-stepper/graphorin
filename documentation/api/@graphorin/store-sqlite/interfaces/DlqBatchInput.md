[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / DlqBatchInput

# Interface: DlqBatchInput

Defined in: packages/store-sqlite/src/consolidator-store.ts:81

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | packages/store-sqlite/src/consolidator-store.ts:83 |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | packages/store-sqlite/src/consolidator-store.ts:86 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | packages/store-sqlite/src/consolidator-store.ts:87 |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | packages/store-sqlite/src/consolidator-store.ts:88 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/store-sqlite/src/consolidator-store.ts:82 |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | packages/store-sqlite/src/consolidator-store.ts:85 |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` | - | packages/store-sqlite/src/consolidator-store.ts:89 |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed; `null`/absent ⇒ legacy 'standard' replay. | packages/store-sqlite/src/consolidator-store.ts:92 |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | packages/store-sqlite/src/consolidator-store.ts:90 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/store-sqlite/src/consolidator-store.ts:84 |
