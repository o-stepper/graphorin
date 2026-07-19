[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / HeartbeatSkipReason

# Type Alias: HeartbeatSkipReason

```ts
type HeartbeatSkipReason = 
  | "inactive-hours"
  | "beat-in-flight"
  | "agent-busy"
  | "empty-checklist"
  | "sentinel"
  | "below-min-length";
```

Defined in: packages/proactive/src/heartbeat.ts:75

**`Stable`**

Why a fire produced no outcome.
