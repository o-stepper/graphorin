[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SqliteMemoryWriteOptions

# Interface: SqliteMemoryWriteOptions

Defined in: [packages/store-sqlite/src/memory-store.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L171)

Extended write surface for fact / episode / message writes. The base
`SemanticMemoryStore.remember(...)` / `EpisodicMemoryStore.put(...)`
methods leave embeddings out - [SqliteMemoryStore](/api/@graphorin/store-sqlite/classes/SqliteMemoryStore.md) accepts an
optional embedding through these helpers.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-embedding"></a> `embedding?` | `readonly` | [`EmbeddingPayload`](/api/@graphorin/store-sqlite/interfaces/EmbeddingPayload.md) | - | [packages/store-sqlite/src/memory-store.ts:172](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L172) |
| <a id="property-indextext"></a> `indexText?` | `readonly` | `string` | Contextual-retrieval index text (P1-3). When supplied, the FTS5 row is indexed against this (context-prepended) text instead of the canonical `fact.text`, so a terse fact stays findable by a vaguely-worded query. The persisted `facts.text` column - the value shown to the user / audit trail - is always the canonical text; only the lexical index is affected. The caller's `embedding.vector` should be computed from the same index text so the vector and FTS surfaces agree. Absent ⇒ the FTS row uses `fact.text` (pre-P1-3 behaviour). | [packages/store-sqlite/src/memory-store.ts:183](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/memory-store.ts#L183) |
