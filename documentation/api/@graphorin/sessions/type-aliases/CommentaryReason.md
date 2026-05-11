[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CommentaryReason

# Type Alias: CommentaryReason

```ts
type CommentaryReason = 
  | "tool.call.start-payload-signature"
  | "tool.call.delta-payload-signature"
  | "tool.call.end-payload-signature"
  | "tool.execute.end-payload-signature"
  | "agent.fanout-event-signature"
  | "context.compacted-event-signature"
  | "agent.model.fellback-event-signature";
```

Defined in: packages/sessions/src/commentary/types.ts:41

Stable label for each detection pattern. Surfaced in the audit row +
the counter label cardinality is bounded.

## Stable
