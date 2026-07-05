[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MigrateEmbedderOptions

# Interface: MigrateEmbedderOptions

Defined in: packages/memory/src/migration/embedder-migration.ts:56

Options accepted by [migrateEmbedder](/api/@graphorin/memory/functions/migrateEmbedder.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchsize"></a> `batchSize?` | `readonly` | `number` | Threshold for `auto-migrate`. The runner streams source rows in batches of `batchSize` (default `512`) and yields progress after each batch. | packages/memory/src/migration/embedder-migration.ts:70 |
| <a id="property-embeddings"></a> `embeddings` | `readonly` | [`EmbeddingMetaRegistryLike`](/api/@graphorin/memory/interfaces/EmbeddingMetaRegistryLike.md) | Storage layer's embedder registry. | packages/memory/src/migration/embedder-migration.ts:62 |
| <a id="property-maxrecordsperkind"></a> `maxRecordsPerKind?` | `readonly` | `number` | Optional cap on the number of rows to migrate per kind. | packages/memory/src/migration/embedder-migration.ts:72 |
| <a id="property-nextbatch"></a> `nextBatch?` | `readonly` | `NextBatchHook` | Hook that returns the next batch of rows to re-embed for a given kind. MST-12: this is **caller-supplied** - there is no store-side helper that auto-wires it today, and `auto-migrate` throws without it. Pass a paging function over your source rows to drive the migration. | packages/memory/src/migration/embedder-migration.ts:79 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional abort signal - aborting yields one final progress event. | packages/memory/src/migration/embedder-migration.ts:81 |
| <a id="property-source"></a> `source` | `readonly` | [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) | Source embedder (currently active). | packages/memory/src/migration/embedder-migration.ts:58 |
| <a id="property-strategy"></a> `strategy?` | `readonly` | [`EmbedderMigrationStrategy`](/api/@graphorin/memory/type-aliases/EmbedderMigrationStrategy.md) | Strategy applied per `embedding_meta` row. Default `'lock-on-first'`. | packages/memory/src/migration/embedder-migration.ts:64 |
| <a id="property-target"></a> `target` | `readonly` | [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) | Target embedder (becomes active when migration commits). | packages/memory/src/migration/embedder-migration.ts:60 |
