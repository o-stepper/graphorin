[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ResolutionCandidate

# Interface: ResolutionCandidate

Defined in: [packages/memory/src/graph/entity-resolver.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L58)

Minimal candidate shape the pure policy compares against.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-embedderid"></a> `embedderId?` | `readonly` | `string` \| `null` | MST-11: the embedder that produced `vector`. When both this and the query's `vectorEmbedderId` are known and differ, the candidate is skipped for embedding comparison - vectors from different models live in different spaces, so their cosine is meaningless. Absent on either side ⇒ compared (byte-identical to the prior behaviour). | [packages/memory/src/graph/entity-resolver.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L69) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/memory/src/graph/entity-resolver.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L59) |
| <a id="property-normalizedname"></a> `normalizedName` | `readonly` | `string` | - | [packages/memory/src/graph/entity-resolver.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L60) |
| <a id="property-vector"></a> `vector` | `readonly` | `Float32Array`\&lt;`ArrayBufferLike`\&gt; \| `null` | - | [packages/memory/src/graph/entity-resolver.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/graph/entity-resolver.ts#L61) |
