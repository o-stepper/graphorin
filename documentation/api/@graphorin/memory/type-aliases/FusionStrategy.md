[**Graphorin API reference v0.7.0**](../../../index.md)

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

Defined in: [packages/memory/src/tiers/semantic-memory.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L119)

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
| `k?` | `number` | Override the RRF constant for the weighted fuse. Default `60`. | [packages/memory/src/tiers/semantic-memory.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L125) |
| `strategy` | `"weighted"` | - | [packages/memory/src/tiers/semantic-memory.ts:122](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L122) |
| `weights` | [`FusionWeights`](/api/@graphorin/memory/interfaces/FusionWeights.md) | - | [packages/memory/src/tiers/semantic-memory.ts:123](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L123) |

## Stable
