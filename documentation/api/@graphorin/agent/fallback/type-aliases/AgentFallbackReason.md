[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fallback](/api/@graphorin/agent/fallback/index.md) / AgentFallbackReason

# Type Alias: AgentFallbackReason

```ts
type AgentFallbackReason = "rate-limit" | "capacity" | "context-length" | "transient";
```

Defined in: packages/agent/src/fallback/index.ts:46

**`Stable`**

Stable taxonomy returned by [isAgentFallbackEligible](/api/@graphorin/agent/fallback/functions/isAgentFallbackEligible.md) on
eligible errors.
