[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EntityUpsertInput

# Interface: EntityUpsertInput

Defined in: packages/memory/src/internal/storage-adapter.ts:811

Find-or-create payload for [GraphMemoryStoreExt.upsertEntity](/api/@graphorin/memory/interfaces/GraphMemoryStoreExt.md#upsertentity).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-embedderid"></a> `embedderId?` | `readonly` | `string` | Embedder that produced [EntityUpsertInput.vector](/api/@graphorin/memory/interfaces/EntityUpsertInput.md#property-vector). | packages/memory/src/internal/storage-adapter.ts:819 |
| <a id="property-name"></a> `name` | `readonly` | `string` | Display name as first observed. | packages/memory/src/internal/storage-adapter.ts:813 |
| <a id="property-normalizedname"></a> `normalizedName` | `readonly` | `string` | Folded key for lexical dedup + the canonical unique index. | packages/memory/src/internal/storage-adapter.ts:815 |
| <a id="property-vector"></a> `vector?` | `readonly` | `Float32Array`\&lt;`ArrayBufferLike`\&gt; | Optional name embedding (back-filled on a hit that lacked one). | packages/memory/src/internal/storage-adapter.ts:817 |
