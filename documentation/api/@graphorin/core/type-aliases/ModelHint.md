[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ModelHint

# Type Alias: ModelHint

```ts
type ModelHint = "fast" | "balanced" | "smart";
```

Defined in: packages/core/src/contracts/preferred-model.ts:23

**`Stable`**

Cost-tier vocabulary for declaring a preferred model on a tool or
agent. Provider-agnostic at the tool-author level; the operator-side
`Agent.modelTierMap?: Partial<Record<ModelHint, ModelSpec>>` mapping
resolves the hint to a concrete provider per agent.

The three tiers describe canonical cloud-provider price-quality
envelopes circa 2026:

- `'fast'`     - low-cost / low-latency / file-navigation /
  parameter-extraction / low-stakes calls.
- `'balanced'` - median cost-quality; the default tier for most
  tools.
- `'smart'`    - high-quality / high-stakes / reasoning-heavy /
  summarization / code-review calls.

The vocabulary is Graphorin's own design - no third-party routing-
guide attribution leaks into the public surface. Per-provider
dispatch lives in `@graphorin/provider/model-tier/classify.ts`.
