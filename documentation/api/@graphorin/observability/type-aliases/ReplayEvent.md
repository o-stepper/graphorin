[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ReplayEvent

# Type Alias: ReplayEvent

```ts
type ReplayEvent = 
  | {
  eventCount?: number;
  mode: ReplayMode;
  target: string;
  type: "replay.start";
}
  | {
  sanitized: boolean;
  span: SpanRecord;
  type: "replay.event";
}
  | {
  reason: "sensitivity" | "redaction-violation" | "access-denied";
  spanId: string;
  type: "replay.skipped";
}
  | {
  durationMs: number;
  eventsEmitted: number;
  eventsSkipped: number;
  type: "replay.end";
};
```

Defined in: packages/observability/src/replay/types.ts:59

**`Stable`**

Single record yielded by the replay iterator.
