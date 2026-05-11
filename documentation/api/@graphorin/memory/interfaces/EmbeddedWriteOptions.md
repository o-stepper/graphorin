[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EmbeddedWriteOptions

# Interface: EmbeddedWriteOptions

Defined in: packages/memory/src/internal/storage-adapter.ts:29

Shape of the embedding payload threaded through the optional
embedded write helpers exposed by adapters such as
`@graphorin/store-sqlite`. Matches the storage adapter's
`SqliteMemoryWriteOptions` byte-for-byte but is declared
structurally here so `@graphorin/memory` does not import the
storage package directly.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-embedding"></a> `embedding?` | `readonly` | \{ `embedderId`: `string`; `vector`: `Float32Array`; \} | packages/memory/src/internal/storage-adapter.ts:30 |
| `embedding.embedderId` | `readonly` | `string` | packages/memory/src/internal/storage-adapter.ts:31 |
| `embedding.vector` | `readonly` | `Float32Array` | packages/memory/src/internal/storage-adapter.ts:32 |
