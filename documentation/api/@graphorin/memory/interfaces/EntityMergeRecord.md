[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EntityMergeRecord

# Interface: EntityMergeRecord

Defined in: packages/memory/src/internal/storage-adapter.ts:832

One row of the append-only merge / unmerge audit ledger.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:839 |
| <a id="property-fromentityid"></a> `fromEntityId` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:836 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:833 |
| <a id="property-intoentityid"></a> `intoEntityId` | `readonly` | `string` \| `null` | packages/memory/src/internal/storage-adapter.ts:837 |
| <a id="property-kind"></a> `kind` | `readonly` | `"merge"` \| `"unmerge"` | packages/memory/src/internal/storage-adapter.ts:835 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:838 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:834 |
