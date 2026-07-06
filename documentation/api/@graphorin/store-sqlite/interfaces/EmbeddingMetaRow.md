[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / EmbeddingMetaRow

# Interface: EmbeddingMetaRow

Defined in: [packages/store-sqlite/src/embedding-meta-repo.ts:11](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L11)

Registry row in the `embedding_meta` table. Captures every embedder
the database has ever indexed against - both the default and any
legacy / migrated peers - together with the names of the per-embedder
vec0 tables that store the actual vectors per memory tier.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-confighash"></a> `configHash` | `readonly` | `string` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L19) |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `number` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L26) |
| <a id="property-dim"></a> `dim` | `readonly` | `number` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L17) |
| <a id="property-distancemetric"></a> `distanceMetric` | `readonly` | `"cosine"` \| `"dot"` \| `"euclidean"` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L18) |
| <a id="property-embedderkind"></a> `embedderKind` | `readonly` | `string` | Adapter family - `'transformersjs'`, `'ollama'`, `'openai'`, `'custom'`, …. | [packages/store-sqlite/src/embedding-meta-repo.ts:15](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L15) |
| <a id="property-id"></a> `id` | `readonly` | `string` | Canonical id, `'<provider>:<model>@<dim>'`. | [packages/store-sqlite/src/embedding-meta-repo.ts:13](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L13) |
| <a id="property-model"></a> `model` | `readonly` | `string` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L16) |
| <a id="property-notes"></a> `notes` | `readonly` | `string` \| `null` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L28) |
| <a id="property-retiredat"></a> `retiredAt` | `readonly` | `number` \| `null` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L27) |
| <a id="property-vectableepisodes"></a> `vecTableEpisodes` | `readonly` | `string` | Lazy-created vec0 table for episodes. | [packages/store-sqlite/src/embedding-meta-repo.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L23) |
| <a id="property-vectablefacts"></a> `vecTableFacts` | `readonly` | `string` | Lazy-created vec0 table for facts. | [packages/store-sqlite/src/embedding-meta-repo.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L21) |
| <a id="property-vectablemessages"></a> `vecTableMessages` | `readonly` | `string` | Lazy-created vec0 table for session messages. | [packages/store-sqlite/src/embedding-meta-repo.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L25) |
