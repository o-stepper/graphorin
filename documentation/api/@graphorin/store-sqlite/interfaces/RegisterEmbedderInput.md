[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / RegisterEmbedderInput

# Interface: RegisterEmbedderInput

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:290

**`Stable`**

Input for [EmbeddingMetaRepository.registerOrReturn](/api/@graphorin/store-sqlite/classes/EmbeddingMetaRepository.md#registerorreturn). The
`embedder_id` is the canonical lookup key; `configHash` is a
deterministic hash over the embedder's full configuration.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-confighash"></a> `configHash` | `readonly` | `string` | - | packages/store-sqlite/src/embedding-meta-repo.ts:296 |
| <a id="property-dim"></a> `dim` | `readonly` | `number` | - | packages/store-sqlite/src/embedding-meta-repo.ts:294 |
| <a id="property-distancemetric"></a> `distanceMetric?` | `readonly` | `"cosine"` \| `"dot"` \| `"euclidean"` | - | packages/store-sqlite/src/embedding-meta-repo.ts:295 |
| <a id="property-embedderkind"></a> `embedderKind` | `readonly` | `string` | - | packages/store-sqlite/src/embedding-meta-repo.ts:292 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/store-sqlite/src/embedding-meta-repo.ts:291 |
| <a id="property-indexmode"></a> `indexMode?` | `readonly` | `string` \| `null` | Write-path contextualization recipe. When supplied, it joins the index version key: a legacy `null` row adopts it once, after which a different mode fails registration exactly like a configHash change. Omitted = legacy caller, no mode check. | packages/store-sqlite/src/embedding-meta-repo.ts:304 |
| <a id="property-model"></a> `model` | `readonly` | `string` | - | packages/store-sqlite/src/embedding-meta-repo.ts:293 |
| <a id="property-notes"></a> `notes?` | `readonly` | `string` \| `null` | - | packages/store-sqlite/src/embedding-meta-repo.ts:305 |
