[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / RegisterEmbedderInput

# Interface: RegisterEmbedderInput

Defined in: [packages/store-sqlite/src/embedding-meta-repo.ts:290](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L290)

Input for [EmbeddingMetaRepository.registerOrReturn](/api/@graphorin/store-sqlite/classes/EmbeddingMetaRepository.md#registerorreturn). The
`embedder_id` is the canonical lookup key; `configHash` is a
deterministic hash over the embedder's full configuration.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-confighash"></a> `configHash` | `readonly` | `string` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:296](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L296) |
| <a id="property-dim"></a> `dim` | `readonly` | `number` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:294](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L294) |
| <a id="property-distancemetric"></a> `distanceMetric?` | `readonly` | `"cosine"` \| `"dot"` \| `"euclidean"` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:295](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L295) |
| <a id="property-embedderkind"></a> `embedderKind` | `readonly` | `string` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:292](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L292) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:291](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L291) |
| <a id="property-indexmode"></a> `indexMode?` | `readonly` | `string` \| `null` | Write-path contextualization recipe (item 10 step 1). When supplied, it joins the index version key: a legacy `null` row adopts it once, after which a different mode fails registration exactly like a configHash change. Omitted = legacy caller, no mode check. | [packages/store-sqlite/src/embedding-meta-repo.ts:304](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L304) |
| <a id="property-model"></a> `model` | `readonly` | `string` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:293](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L293) |
| <a id="property-notes"></a> `notes?` | `readonly` | `string` \| `null` | - | [packages/store-sqlite/src/embedding-meta-repo.ts:305](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L305) |
