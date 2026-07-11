[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ModelSpec

# Type Alias: ModelSpec

```ts
type ModelSpec = 
  | ProviderLike
  | {
  model: string;
  provider: ProviderLike;
};
```

Defined in: [packages/core/src/contracts/preferred-model.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/preferred-model.ts#L56)

Concrete provider declaration used at site of the per-tool hint
override (Phase 07), the per-tier mapping
(`Agent.modelTierMap`, Phase 12), and the agent-level fallback chain
(`Agent.fallbackModels`, Phase 12).

The shape is unified deliberately so operators learn one thing and
use it three places.

## Stable
