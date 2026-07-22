[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ResolveDecisionInput

# Interface: ResolveDecisionInput

Defined in: packages/memory/src/graph/entity-resolver.ts:73

Inputs to [resolveEntityDecision](/api/@graphorin/memory/functions/resolveEntityDecision.md) (all provided by the caller).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-adjudicatethreshold"></a> `adjudicateThreshold` | `readonly` | `number` | - | packages/memory/src/graph/entity-resolver.ts:80 |
| <a id="property-candidates"></a> `candidates` | `readonly` | readonly [`ResolutionCandidate`](/api/@graphorin/memory/interfaces/ResolutionCandidate.md)[] | - | packages/memory/src/graph/entity-resolver.ts:78 |
| <a id="property-mergethreshold"></a> `mergeThreshold` | `readonly` | `number` | - | packages/memory/src/graph/entity-resolver.ts:79 |
| <a id="property-normalizedname"></a> `normalizedName` | `readonly` | `string` | - | packages/memory/src/graph/entity-resolver.ts:74 |
| <a id="property-vector"></a> `vector?` | `readonly` | `Float32Array`\&lt;`ArrayBufferLike`\&gt; \| `null` | - | packages/memory/src/graph/entity-resolver.ts:75 |
| <a id="property-vectorembedderid"></a> `vectorEmbedderId?` | `readonly` | `string` \| `null` | The embedder that produced `vector` (gates cross-embedder cosine). | packages/memory/src/graph/entity-resolver.ts:77 |
