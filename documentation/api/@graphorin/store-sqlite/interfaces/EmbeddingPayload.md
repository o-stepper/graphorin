[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / EmbeddingPayload

# Interface: EmbeddingPayload

Defined in: packages/store-sqlite/src/memory-store.ts:36

Optional embedding payload attached to a memory write. The
`embedder_id` must already be registered in `embedding_meta`; the
`vector` length must match the registered `dim`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-embedderid"></a> `embedderId` | `readonly` | `string` | packages/store-sqlite/src/memory-store.ts:37 |
| <a id="property-vector"></a> `vector` | `readonly` | `Float32Array` | packages/store-sqlite/src/memory-store.ts:38 |
