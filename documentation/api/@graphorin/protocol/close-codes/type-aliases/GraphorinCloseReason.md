[**Graphorin API reference v0.14.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [close-codes](/api/@graphorin/protocol/close-codes/index.md) / GraphorinCloseReason

# Type Alias: GraphorinCloseReason

```ts
type GraphorinCloseReason = 
  | "auth.required"
  | "auth.invalid"
  | "auth.revoked"
  | "auth.scope_denied"
  | "rate.limited"
  | "flow.throttled"
  | "server.shutdown"
  | "protocol.violation";
```

Defined in: src/close-codes.ts:15

**`Stable`**

Discriminator for every Graphorin-defined close code. The
matching numeric value is exposed via [CLOSE\_CODE\_VALUES](/api/@graphorin/protocol/close-codes/variables/CLOSE_CODE_VALUES.md).
