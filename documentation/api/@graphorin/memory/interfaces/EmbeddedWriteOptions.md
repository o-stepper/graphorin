[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EmbeddedWriteOptions

# Interface: EmbeddedWriteOptions

Defined in: packages/memory/src/internal/storage-adapter.ts:35

Shape of the embedding payload threaded through the optional
embedded write helpers exposed by adapters such as
`@graphorin/store-sqlite`. Matches the storage adapter's
`SqliteMemoryWriteOptions` byte-for-byte but is declared
structurally here so `@graphorin/memory` does not import the
storage package directly.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-embedding"></a> `embedding?` | `readonly` | \{ `embedderId`: `string`; `vector`: `Float32Array`; \} | - | packages/memory/src/internal/storage-adapter.ts:36 |
| `embedding.embedderId` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:37 |
| `embedding.vector` | `readonly` | `Float32Array` | - | packages/memory/src/internal/storage-adapter.ts:38 |
| <a id="property-indextext"></a> `indexText?` | `readonly` | `string` | Contextual-retrieval index text (P1-3). When supplied, the adapter indexes its lexical (FTS) surface against this context-prepended text while persisting the canonical `text` unchanged. Absent ⇒ the canonical text is indexed (pre-P1-3 behaviour). | packages/memory/src/internal/storage-adapter.ts:46 |
