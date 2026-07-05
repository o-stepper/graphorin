[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostScope

# Type Alias: CostScope

```ts
type CostScope = "run" | "session" | "agent" | "user";
```

Defined in: packages/observability/src/cost/types.ts:17

Aggregation scope used by [CostTracker.usage](/api/@graphorin/observability/interfaces/CostTracker.md#usage). The framework
tracks four canonical scopes; deployments needing additional
dimensions can build them by registering listeners on
`CostTracker.onRollup(...)`.

## Stable
