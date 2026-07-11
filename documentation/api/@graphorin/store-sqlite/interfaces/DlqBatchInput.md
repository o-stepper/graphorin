[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / DlqBatchInput

# Interface: DlqBatchInput

Defined in: [packages/store-sqlite/src/consolidator-store.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L81)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidatorrunid"></a> `consolidatorRunId` | `readonly` | `string` \| `null` | - | [packages/store-sqlite/src/consolidator-store.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L83) |
| <a id="property-errorkind"></a> `errorKind` | `readonly` | `string` | - | [packages/store-sqlite/src/consolidator-store.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L86) |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` | - | [packages/store-sqlite/src/consolidator-store.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L87) |
| <a id="property-failedat"></a> `failedAt` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L88) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/store-sqlite/src/consolidator-store.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L82) |
| <a id="property-messageids"></a> `messageIds` | `readonly` | readonly `string`[] | - | [packages/store-sqlite/src/consolidator-store.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L85) |
| <a id="property-nextretryat"></a> `nextRetryAt` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L89) |
| <a id="property-phase"></a> `phase?` | `readonly` | `"light"` \| `"standard"` \| `"deep"` \| `null` | Phase that failed (MCON-10); `null`/absent ⇒ legacy 'standard' replay. | [packages/store-sqlite/src/consolidator-store.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L92) |
| <a id="property-retrycount"></a> `retryCount` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L90) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | [packages/store-sqlite/src/consolidator-store.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L84) |
