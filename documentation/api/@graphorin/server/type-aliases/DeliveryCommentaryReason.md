[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentaryReason

# Type Alias: DeliveryCommentaryReason

```ts
type DeliveryCommentaryReason = 
  | "tool.call.start-payload-signature"
  | "tool.call.delta-payload-signature"
  | "tool.call.end-payload-signature"
  | "tool.execute.end-payload-signature"
  | "agent.fanout-event-signature"
  | "context.compacted-event-signature"
  | "agent.model.fellback-event-signature";
```

Defined in: packages/server/src/commentary/types.ts:50

**`Stable`**

Stable label for each detection pattern. Surfaced in the audit row
+ the counter label cardinality is bounded.
