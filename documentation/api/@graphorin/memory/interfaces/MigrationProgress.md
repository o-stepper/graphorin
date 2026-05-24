[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MigrationProgress

# Interface: MigrationProgress

Defined in: packages/memory/src/migration/embedder-migration.ts:30

Per-iteration progress snapshot yielded by [migrateEmbedder](/api/@graphorin/memory/functions/migrateEmbedder.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"fact"` \| `"message"` \| `"episode"` | `'fact'`, `'episode'`, or `'message'` — which entity is being migrated. | packages/memory/src/migration/embedder-migration.ts:32 |
| <a id="property-migrationid"></a> `migrationId` | `readonly` | `string` | Migration row id in the persistent `migration_state` table. | packages/memory/src/migration/embedder-migration.ts:42 |
| <a id="property-phase"></a> `phase` | `readonly` | `"aborted"` \| `"paused"` \| `"running"` \| `"planning"` \| `"committed"` | Phase discriminator. | packages/memory/src/migration/embedder-migration.ts:44 |
| <a id="property-processed"></a> `processed` | `readonly` | `number` | Number of records processed so far. | packages/memory/src/migration/embedder-migration.ts:34 |
| <a id="property-source"></a> `source` | `readonly` | `string` | Identifier of the source embedder (`'<adapter>:<model>@<dim>'`). | packages/memory/src/migration/embedder-migration.ts:38 |
| <a id="property-target"></a> `target` | `readonly` | `string` | Identifier of the target embedder. | packages/memory/src/migration/embedder-migration.ts:40 |
| <a id="property-total"></a> `total` | `readonly` | `number` | Total records expected for this entity (when known). | packages/memory/src/migration/embedder-migration.ts:36 |
