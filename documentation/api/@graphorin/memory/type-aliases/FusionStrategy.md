[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FusionStrategy

# Type Alias: FusionStrategy

```ts
type FusionStrategy = 
  | {
  strategy: "rrf";
}
  | {
  k?: number;
  strategy: "weighted";
  weights: FusionWeights;
};
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:121

**`Stable`**

Score-fusion strategy for [SemanticMemory.search](/api/@graphorin/memory/classes/SemanticMemory.md#search) (X-2).

- `'rrf'` (the default when `fusion` is omitted) fuses the candidate
  lists through the configured reranker - the zero-tuning
  [RRFReranker](/api/@graphorin/memory/classes/RRFReranker.md) unless one was overridden.
- `'weighted'` fuses through [WeightedRRFReranker](/api/@graphorin/memory/classes/WeightedRRFReranker.md), scaling each
  list's reciprocal-rank contribution by its [FusionWeights](/api/@graphorin/memory/interfaces/FusionWeights.md), for
  callers who have calibrated retriever reliability against labels (the
  P0-1 eval harness). At equal weights it reproduces RRF.

## Union Members

### Type Literal

```ts
{
  strategy: "rrf";
}
```

***

### Type Literal

```ts
{
  k?: number;
  strategy: "weighted";
  weights: FusionWeights;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `k?` | `number` | Override the RRF constant for the weighted fuse. Default `60`. | packages/memory/src/tiers/semantic-memory.ts:127 |
| `strategy` | `"weighted"` | - | packages/memory/src/tiers/semantic-memory.ts:124 |
| `weights` | [`FusionWeights`](/api/@graphorin/memory/interfaces/FusionWeights.md) | - | packages/memory/src/tiers/semantic-memory.ts:125 |
