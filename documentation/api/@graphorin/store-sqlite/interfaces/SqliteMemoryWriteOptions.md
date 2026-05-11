[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteMemoryWriteOptions

# Interface: SqliteMemoryWriteOptions

Defined in: packages/store-sqlite/src/memory-store.ts:49

Extended write surface for fact / episode / message writes. The base
`SemanticMemoryStore.remember(...)` / `EpisodicMemoryStore.put(...)`
methods leave embeddings out — [SqliteMemoryStore](/api/@graphorin/store-sqlite/classes/SqliteMemoryStore.md) accepts an
optional embedding through these helpers.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-embedding"></a> `embedding?` | `readonly` | [`EmbeddingPayload`](/api/@graphorin/store-sqlite/interfaces/EmbeddingPayload.md) | packages/store-sqlite/src/memory-store.ts:50 |
