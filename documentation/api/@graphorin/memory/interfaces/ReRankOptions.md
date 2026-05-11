[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ReRankOptions

# Interface: ReRankOptions

Defined in: packages/memory/src/search/types.ts:38

Per-call reranker options. `topK` defaults to `10`; `signal` is
propagated to any async work the reranker performs.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/memory/src/search/types.ts:40 |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | packages/memory/src/search/types.ts:39 |
