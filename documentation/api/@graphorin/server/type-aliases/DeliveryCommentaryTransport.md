[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentaryTransport

# Type Alias: DeliveryCommentaryTransport

```ts
type DeliveryCommentaryTransport = "ws" | "sse" | "rest";
```

Defined in: packages/server/src/commentary/types.ts:42

**`Stable`**

Discriminator surfaced on audit rows + counter labels for the
transport that produced the sanitization decision. The cardinality
is bounded (3-valued).
