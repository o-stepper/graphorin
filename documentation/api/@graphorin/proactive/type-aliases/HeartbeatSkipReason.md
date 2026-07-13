[**Graphorin API reference v0.9.0**](../../../index.md)

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

Defined in: [packages/proactive/src/heartbeat.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L75)

Why a fire produced no outcome.

## Stable
