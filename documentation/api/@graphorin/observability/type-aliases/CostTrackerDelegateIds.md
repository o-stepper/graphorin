[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostTrackerDelegateIds

# Type Alias: CostTrackerDelegateIds

```ts
type CostTrackerDelegateIds = Pick<CostRecordInput, "spanId" | "parentSpanId" | "runId" | "sessionId" | "agentId" | "userId">;
```

Defined in: [packages/observability/src/cost/delegate.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/delegate.ts#L49)

Attribution ids for one recorded call. `spanId` is mandatory (the
tracker keys rollups on it); everything else is optional scope
attribution.

## Stable
