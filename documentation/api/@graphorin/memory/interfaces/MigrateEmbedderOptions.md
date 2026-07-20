[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MigrateEmbedderOptions

# Interface: MigrateEmbedderOptions

Defined in: packages/memory/src/migration/embedder-migration.ts:92

**`Stable`**

Options accepted by [migrateEmbedder](/api/@graphorin/memory/functions/migrateEmbedder.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchsize"></a> `batchSize?` | `readonly` | `number` | Threshold for `auto-migrate`. The runner streams source rows in batches of `batchSize` (default `512`) and yields progress after each batch. | packages/memory/src/migration/embedder-migration.ts:106 |
| <a id="property-embeddings"></a> `embeddings` | `readonly` | [`EmbeddingMetaRegistryLike`](/api/@graphorin/memory/interfaces/EmbeddingMetaRegistryLike.md) | Storage layer's embedder registry. | packages/memory/src/migration/embedder-migration.ts:98 |
| <a id="property-maxrecordsperkind"></a> `maxRecordsPerKind?` | `readonly` | `number` | Optional cap on the number of rows to migrate per kind. | packages/memory/src/migration/embedder-migration.ts:108 |
| <a id="property-nextbatch"></a> `nextBatch?` | `readonly` | [`NextBatchHook`](/api/@graphorin/memory/type-aliases/NextBatchHook.md) | Hook that returns the next batch of rows to re-embed for a given kind. `auto-migrate` throws without it. The default `@graphorin/store-sqlite` adapter ships one as `store.embedderMigration.nextBatch`; custom adapters pass their own paging function. | packages/memory/src/migration/embedder-migration.ts:116 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional abort signal - aborting yields one final progress event. | packages/memory/src/migration/embedder-migration.ts:127 |
| <a id="property-source"></a> `source` | `readonly` | [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) | Source embedder (currently active). | packages/memory/src/migration/embedder-migration.ts:94 |
| <a id="property-state"></a> `state?` | `readonly` | [`MigrationStateStoreLike`](/api/@graphorin/memory/interfaces/MigrationStateStoreLike.md) | Persisted cursor store. When supplied, `auto-migrate` records progress after every batch into `migration_state` and RESUMES from the persisted cursor on the next invocation (same source/target pair) - across process restarts and kills. An explicit abort marks the row `aborted` (still resumable); commit marks it `committed`. | packages/memory/src/migration/embedder-migration.ts:125 |
| <a id="property-strategy"></a> `strategy?` | `readonly` | [`EmbedderMigrationStrategy`](/api/@graphorin/memory/type-aliases/EmbedderMigrationStrategy.md) | Strategy applied per `embedding_meta` row. Default `'lock-on-first'`. | packages/memory/src/migration/embedder-migration.ts:100 |
| <a id="property-target"></a> `target` | `readonly` | [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) | Target embedder (becomes active when migration commits). | packages/memory/src/migration/embedder-migration.ts:96 |
