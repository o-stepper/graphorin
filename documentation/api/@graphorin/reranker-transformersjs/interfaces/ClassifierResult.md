[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / ClassifierResult

# Interface: ClassifierResult

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:33

**`Internal`**

Output shape returned by `@huggingface/transformers`'
text-classification pipeline. Each pair returns either a single
`{ label, score }` object (top-k = 1) or an array of them. We
normalise on the array form upstream so the cross-encoder always
sees a consistent shape.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-label"></a> `label` | `readonly` | `string` | packages/reranker-transformersjs/src/cross-encoder.ts:34 |
| <a id="property-score"></a> `score` | `readonly` | `number` | packages/reranker-transformersjs/src/cross-encoder.ts:35 |
