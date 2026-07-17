[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ReRankOptions

# Interface: ReRankOptions

Defined in: [packages/memory/src/search/types.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/types.ts#L38)

Per-call reranker options. `topK` defaults to `10`; `signal` is
propagated to any async work the reranker performs.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-labels"></a> `labels?` | `readonly` | readonly `string`[] | Stable per-list labels for the explanation signals (MRET-13) - `rrf.<label>` instead of the ephemeral `rrf.list_<index>`. Callers that fan lists out conditionally (multi-query, HyDE, graph) pass retriever-kind labels so X-3 consumers can identify which leg a contribution came from across calls. Missing entries fall back to the positional key. | [packages/memory/src/search/types.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/types.ts#L49) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/memory/src/search/types.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/types.ts#L40) |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | - | [packages/memory/src/search/types.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/types.ts#L39) |
