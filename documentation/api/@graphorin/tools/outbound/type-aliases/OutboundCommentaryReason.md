[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [outbound](/api/@graphorin/tools/outbound/index.md) / OutboundCommentaryReason

# Type Alias: OutboundCommentaryReason

```ts
type OutboundCommentaryReason = 
  | "tool.call.start-payload-signature"
  | "tool.call.delta-payload-signature"
  | "tool.call.end-payload-signature"
  | "tool.execute.end-payload-signature"
  | "agent.fanout-event-signature"
  | "context.compacted-event-signature"
  | "agent.model.fellback-event-signature";
```

Defined in: packages/tools/src/outbound/commentary-patterns.ts:49

**`Stable`**

Stable label for each detection pattern. Surfaced in audit rows;
the counter label cardinality is bounded.
