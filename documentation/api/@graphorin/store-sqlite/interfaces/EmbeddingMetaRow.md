[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / EmbeddingMetaRow

# Interface: EmbeddingMetaRow

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:11

**`Stable`**

Registry row in the `embedding_meta` table. Captures every embedder
the database has ever indexed against - both the default and any
legacy / migrated peers - together with the names of the per-embedder
vec0 tables that store the actual vectors per memory tier.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-confighash"></a> `configHash` | `readonly` | `string` | - | packages/store-sqlite/src/embedding-meta-repo.ts:19 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `number` | - | packages/store-sqlite/src/embedding-meta-repo.ts:36 |
| <a id="property-dim"></a> `dim` | `readonly` | `number` | - | packages/store-sqlite/src/embedding-meta-repo.ts:17 |
| <a id="property-distancemetric"></a> `distanceMetric` | `readonly` | `"cosine"` \| `"dot"` \| `"euclidean"` | - | packages/store-sqlite/src/embedding-meta-repo.ts:18 |
| <a id="property-embedderkind"></a> `embedderKind` | `readonly` | `string` | Adapter family - `'transformersjs'`, `'ollama'`, `'openai'`, `'custom'`, …. | packages/store-sqlite/src/embedding-meta-repo.ts:15 |
| <a id="property-id"></a> `id` | `readonly` | `string` | Canonical id, `'<provider>:<model>@<dim>'`. | packages/store-sqlite/src/embedding-meta-repo.ts:13 |
| <a id="property-indexmode"></a> `indexMode` | `readonly` | `string` \| `null` | Write-path contextualization recipe the index was built with - e.g. `'late-chunk'`, `'off'`, `'late-chunk+llm'`. Part of the index version key: a different mode means the stored vectors were computed from differently contextualized text, which is as incompatible as a different model. `null` marks a legacy row registered before the column existed; it adopts the caller's mode on the next `registerOrReturn`. | packages/store-sqlite/src/embedding-meta-repo.ts:29 |
| <a id="property-model"></a> `model` | `readonly` | `string` | - | packages/store-sqlite/src/embedding-meta-repo.ts:16 |
| <a id="property-notes"></a> `notes` | `readonly` | `string` \| `null` | - | packages/store-sqlite/src/embedding-meta-repo.ts:38 |
| <a id="property-retiredat"></a> `retiredAt` | `readonly` | `number` \| `null` | - | packages/store-sqlite/src/embedding-meta-repo.ts:37 |
| <a id="property-vectableepisodes"></a> `vecTableEpisodes` | `readonly` | `string` | Lazy-created vec0 table for episodes. | packages/store-sqlite/src/embedding-meta-repo.ts:33 |
| <a id="property-vectablefacts"></a> `vecTableFacts` | `readonly` | `string` | Lazy-created vec0 table for facts. | packages/store-sqlite/src/embedding-meta-repo.ts:31 |
| <a id="property-vectablemessages"></a> `vecTableMessages` | `readonly` | `string` | Lazy-created vec0 table for session messages. | packages/store-sqlite/src/embedding-meta-repo.ts:35 |
