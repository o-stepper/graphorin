[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MigrationProgress

# Interface: MigrationProgress

Defined in: [packages/memory/src/migration/embedder-migration.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L30)

Per-iteration progress snapshot yielded by [migrateEmbedder](/api/@graphorin/memory/functions/migrateEmbedder.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"fact"` \| `"episode"` \| `"message"` | `'fact'`, `'episode'`, or `'message'` - which entity is being migrated. | [packages/memory/src/migration/embedder-migration.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L32) |
| <a id="property-migrationid"></a> `migrationId` | `readonly` | `string` | Identifier for this migration run. With a `state` store wired (wave-D D5 / MST-12) this is the PERSISTED `migration_state` row id - a resumed run reports the original id. Without one it is an in-memory id and the migration does not resume across processes. | [packages/memory/src/migration/embedder-migration.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L47) |
| <a id="property-phase"></a> `phase` | `readonly` | `"aborted"` \| `"paused"` \| `"running"` \| `"planning"` \| `"committed"` | Phase discriminator. | [packages/memory/src/migration/embedder-migration.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L49) |
| <a id="property-processed"></a> `processed` | `readonly` | `number` | Number of records processed so far. | [packages/memory/src/migration/embedder-migration.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L34) |
| <a id="property-source"></a> `source` | `readonly` | `string` | Identifier of the source embedder (`'<adapter>:<model>@<dim>'`). | [packages/memory/src/migration/embedder-migration.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L38) |
| <a id="property-target"></a> `target` | `readonly` | `string` | Identifier of the target embedder. | [packages/memory/src/migration/embedder-migration.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L40) |
| <a id="property-total"></a> `total` | `readonly` | `number` | Total records expected for this entity (when known). | [packages/memory/src/migration/embedder-migration.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/migration/embedder-migration.ts#L36) |
