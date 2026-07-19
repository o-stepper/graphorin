[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / ClassifierResult

# Interface: ClassifierResult

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:49

**`Internal`**

Output shape returned by `@huggingface/transformers`'
text-classification pipeline. Each pair returns either a single
`{ label, score }` object (top-k = 1) or an array of them. We
normalise on the array form upstream so the cross-encoder always
sees a consistent shape.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-label"></a> `label` | `readonly` | `string` | packages/reranker-transformersjs/src/cross-encoder.ts:50 |
| <a id="property-score"></a> `score` | `readonly` | `number` | packages/reranker-transformersjs/src/cross-encoder.ts:51 |
