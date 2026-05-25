[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / cosineSimilarity

# Function: cosineSimilarity()

```ts
function cosineSimilarity(a, b): number;
```

Defined in: packages/memory/src/graph/entity-resolver.ts:96

Cosine similarity of two embeddings in `[-1, 1]`. Compares over the
shorter length and returns `0` when either vector is empty / zero-norm.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | `Float32Array` |
| `b` | `Float32Array` |

## Returns

`number`

## Stable
