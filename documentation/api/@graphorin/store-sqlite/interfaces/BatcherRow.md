[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / BatcherRow

# Interface: BatcherRow

Defined in: packages/store-sqlite/src/embedder-migration-support.ts:164

**`Stable`**

One row handed to the embedder-migration batcher by
`GraphorinSqliteStore.embedderMigration.nextBatch`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/store-sqlite/src/embedder-migration-support.ts:165 |
| <a id="property-text"></a> `text` | `readonly` | `string` | packages/store-sqlite/src/embedder-migration-support.ts:166 |
| <a id="property-write"></a> `write` | `readonly` | (`vector`) => `Promise`\&lt;`void`\&gt; | packages/store-sqlite/src/embedder-migration-support.ts:167 |
