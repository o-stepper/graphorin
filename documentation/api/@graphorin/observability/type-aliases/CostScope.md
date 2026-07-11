[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostScope

# Type Alias: CostScope

```ts
type CostScope = "run" | "session" | "agent" | "user";
```

Defined in: [packages/observability/src/cost/types.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L17)

Aggregation scope used by [CostTracker.usage](/api/@graphorin/observability/interfaces/CostTracker.md#usage). The framework
tracks four canonical scopes; deployments needing additional
dimensions can build them by registering listeners on
`CostTracker.onRollup(...)`.

## Stable
