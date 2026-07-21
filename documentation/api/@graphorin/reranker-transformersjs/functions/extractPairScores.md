[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / extractPairScores

# Function: extractPairScores()

```ts
function extractPairScores(raw, pairCount): number[];
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:258

**`Internal`**

Normalises the raw pipeline output to a flat `score[]` aligned with the input
pair order. Cross-encoder classifiers return either a single-best
`{label, score}` per pair (the default single-logit bge exports) or an array
of `topk` entries. For the array shape we read the POSITIVE label's
confidence - NOT the max of any label: an irrelevant pair's most
confident class is the *negative* one, so taking the max would invert the
ranking for any 2-label classifier. When no label looks positive (single-logit
or unrecognised labels) we fall back to the top score.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | \| readonly [`ClassifierResult`](/api/@graphorin/reranker-transformersjs/interfaces/ClassifierResult.md)[] \| readonly readonly [`ClassifierResult`](/api/@graphorin/reranker-transformersjs/interfaces/ClassifierResult.md)[][] |
| `pairCount` | `number` |

## Returns

`number`[]
