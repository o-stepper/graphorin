[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / extractPairScores

# Function: extractPairScores()

```ts
function extractPairScores(raw, pairCount): number[];
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:104

**`Internal`**

Normalises the raw pipeline output to a flat `score[]` aligned with
the input pair order. Cross-encoder classifiers return either a
single-best `{label, score}` per pair or an array of `topk` entries
— we collapse on the highest-scoring positive label.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | \| readonly [`ClassifierResult`](/api/@graphorin/reranker-transformersjs/interfaces/ClassifierResult.md)[] \| readonly readonly [`ClassifierResult`](/api/@graphorin/reranker-transformersjs/interfaces/ClassifierResult.md)[][] |
| `pairCount` | `number` |

## Returns

`number`[]
