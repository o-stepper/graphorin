[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RecalledMemoryExplanation

# Interface: RecalledMemoryExplanation

Defined in: packages/memory/src/search/explain.ts:27

**`Stable`**

Per-memory contribution breakdown for one recalled record: the
decomposed signals the hybrid pipeline summed into the final score,
plus the record's final rank. Surfaces *why* a single memory was
recalled and how it ranked relative to its siblings.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Record id (fact / episode / insight / …). | packages/memory/src/search/explain.ts:29 |
| <a id="property-kind"></a> `kind` | `readonly` | [`MemoryKind`](/api/@graphorin/core/type-aliases/MemoryKind.md) | Memory kind of the recalled record. | packages/memory/src/search/explain.ts:31 |
| <a id="property-rank"></a> `rank` | `readonly` | `number` | 1-based position in the final fused + decayed ranking. | packages/memory/src/search/explain.ts:33 |
| <a id="property-score"></a> `score` | `readonly` | `number` | Final score after fusion and (optional) decay. | packages/memory/src/search/explain.ts:35 |
| <a id="property-signals"></a> `signals` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Raw per-signal scores contributing to `score`, exactly as the pipeline recorded them on the hit: FTS (`bm25`), vector similarity (`vector`), the fused reciprocal-rank terms (`rrf` plus one `rrf.<label>` entry per fused list keyed by the retriever kind, e.g. `rrf.fts` / `rrf.vector`, with `rrf.list_N` as the fallback when a list carries no label), and the decay multiplier (`decay`) when decay ran. | packages/memory/src/search/explain.ts:45 |
