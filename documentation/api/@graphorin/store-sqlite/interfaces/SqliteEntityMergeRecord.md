[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteEntityMergeRecord

# Interface: SqliteEntityMergeRecord

Defined in: packages/store-sqlite/src/memory-store.ts:2183

**`Stable`**

Merge-audit row returned by [SqliteGraphStore.listMerges](/api/@graphorin/store-sqlite/classes/SqliteGraphStore.md#listmerges).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | packages/store-sqlite/src/memory-store.ts:2190 |
| <a id="property-fromentityid"></a> `fromEntityId` | `readonly` | `string` | packages/store-sqlite/src/memory-store.ts:2187 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/store-sqlite/src/memory-store.ts:2184 |
| <a id="property-intoentityid"></a> `intoEntityId` | `readonly` | `string` \| `null` | packages/store-sqlite/src/memory-store.ts:2188 |
| <a id="property-kind"></a> `kind` | `readonly` | `"merge"` \| `"unmerge"` | packages/store-sqlite/src/memory-store.ts:2186 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | packages/store-sqlite/src/memory-store.ts:2189 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | packages/store-sqlite/src/memory-store.ts:2185 |
