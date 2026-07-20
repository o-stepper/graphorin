[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / scoresFromLogits

# Function: scoresFromLogits()

```ts
function scoresFromLogits(
   data, 
   dims, 
   id2label, 
   pairCount): number[];
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:303

**`Internal`**

Convert a raw `[pairCount, numLabels]` logits tensor into relevance
scores aligned with the input pair order:

 - single-logit heads (the default bge reranker exports) → sigmoid,
   preserving the model's discrimination instead of softmaxing the
   lone logit to a constant `1.0`;
 - multi-logit heads → softmax over the row, reading the POSITIVE
   label's probability via `config.id2label` (falling back to index 1
   for unlabeled binary heads per the `LABEL_0`/`LABEL_1` convention,
   then to the max probability - parity with
   [extractPairScores](/api/@graphorin/reranker-transformersjs/functions/extractPairScores.md)).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `ArrayLike`\&lt;`number`\&gt; |
| `dims` | readonly `number`[] |
| `id2label` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> \| `undefined` |
| `pairCount` | `number` |

## Returns

`number`[]
