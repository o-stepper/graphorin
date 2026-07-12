[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / OutboundCommentaryReason

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

Defined in: [packages/tools/dist/outbound/commentary-patterns.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/outbound/commentary-patterns.d.ts)

Stable label for each detection pattern. Surfaced in audit rows;
the counter label cardinality is bounded.

## Stable
