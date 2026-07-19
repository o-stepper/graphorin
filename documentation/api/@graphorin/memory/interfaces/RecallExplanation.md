[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RecallExplanation

# Interface: RecallExplanation

Defined in: packages/memory/src/search/explain.ts:57

**`Stable`**

Structured "why was this recalled?" explanation for one
[SemanticMemory.search](/api/@graphorin/memory/classes/SemanticMemory.md#search) call: the query, the reranker that
fused the candidate lists, and the per-memory signal breakdown in
final-rank order. Pure data - safe to attach to a span, log, or
render.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-count"></a> `count` | `readonly` | `number` | Number of recalled memories explained. | packages/memory/src/search/explain.ts:63 |
| <a id="property-query"></a> `query` | `readonly` | `string` | The query the recall ran for. | packages/memory/src/search/explain.ts:59 |
| <a id="property-rerankerid"></a> `rerankerId` | `readonly` | `string` | Stable id of the reranker that fused the candidate lists. | packages/memory/src/search/explain.ts:61 |
| <a id="property-results"></a> `results` | `readonly` | readonly [`RecalledMemoryExplanation`](/api/@graphorin/memory/interfaces/RecalledMemoryExplanation.md)[] | Per-memory breakdown, in final-rank order (rank 1 first). | packages/memory/src/search/explain.ts:65 |
