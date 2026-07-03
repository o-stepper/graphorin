[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / RegisterEmbedderInput

# Interface: RegisterEmbedderInput

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:240

Input for [EmbeddingMetaRepository.registerOrReturn](/api/@graphorin/store-sqlite/classes/EmbeddingMetaRepository.md#registerorreturn). The
`embedder_id` is the canonical lookup key; `configHash` is a
deterministic hash over the embedder's full configuration.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-confighash"></a> `configHash` | `readonly` | `string` | packages/store-sqlite/src/embedding-meta-repo.ts:246 |
| <a id="property-dim"></a> `dim` | `readonly` | `number` | packages/store-sqlite/src/embedding-meta-repo.ts:244 |
| <a id="property-distancemetric"></a> `distanceMetric?` | `readonly` | `"cosine"` \| `"dot"` \| `"euclidean"` | packages/store-sqlite/src/embedding-meta-repo.ts:245 |
| <a id="property-embedderkind"></a> `embedderKind` | `readonly` | `string` | packages/store-sqlite/src/embedding-meta-repo.ts:242 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/store-sqlite/src/embedding-meta-repo.ts:241 |
| <a id="property-model"></a> `model` | `readonly` | `string` | packages/store-sqlite/src/embedding-meta-repo.ts:243 |
| <a id="property-notes"></a> `notes?` | `readonly` | `string` \| `null` | packages/store-sqlite/src/embedding-meta-repo.ts:247 |
