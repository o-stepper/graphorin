[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ResolveDecisionInput

# Interface: ResolveDecisionInput

Defined in: packages/memory/src/graph/entity-resolver.ts:65

Inputs to [resolveEntityDecision](/api/@graphorin/memory/functions/resolveEntityDecision.md) (all provided by the caller).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-adjudicatethreshold"></a> `adjudicateThreshold` | `readonly` | `number` | packages/memory/src/graph/entity-resolver.ts:70 |
| <a id="property-candidates"></a> `candidates` | `readonly` | readonly [`ResolutionCandidate`](/api/@graphorin/memory/interfaces/ResolutionCandidate.md)[] | packages/memory/src/graph/entity-resolver.ts:68 |
| <a id="property-mergethreshold"></a> `mergeThreshold` | `readonly` | `number` | packages/memory/src/graph/entity-resolver.ts:69 |
| <a id="property-normalizedname"></a> `normalizedName` | `readonly` | `string` | packages/memory/src/graph/entity-resolver.ts:66 |
| <a id="property-vector"></a> `vector?` | `readonly` | `Float32Array`\&lt;`ArrayBufferLike`\&gt; \| `null` | packages/memory/src/graph/entity-resolver.ts:67 |
