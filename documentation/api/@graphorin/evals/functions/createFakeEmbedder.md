[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / createFakeEmbedder

# Function: createFakeEmbedder()

```ts
function createFakeEmbedder(dim?): EmbedderProvider;
```

Defined in: packages/evals/src/fake-embedder.ts:21

**`Stable`**

Deterministic, offline bag-of-words hash embedder (evals-01). Not a
real semantic model - it exists so the VECTOR leg of hybrid search
(and the reconcile / graph / HyDE paths that ride it) can be
exercised and A/B-compared in CI without a model download. Real
embedding quality needs a real embedder.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `dim` | `number` | `64` |

## Returns

[`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md)
