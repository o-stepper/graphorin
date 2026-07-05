[**Graphorin API reference v0.6.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [close-codes](/api/@graphorin/protocol/close-codes/index.md) / CLOSE\_CODE\_VALUES

# Variable: CLOSE\_CODE\_VALUES

```ts
const CLOSE_CODE_VALUES: Readonly<{
  auth.invalid: 4002;
  auth.required: 4001;
  auth.revoked: 4003;
  auth.scope_denied: 4004;
  flow.throttled: 4006;
  protocol.violation: 4008;
  rate.limited: 4005;
  server.shutdown: 4007;
}>;
```

Defined in: src/close-codes.ts:31

Numeric close-code constants. The pair `(value, reason)` round-trips
via [closeCodeReason](/api/@graphorin/protocol/close-codes/functions/closeCodeReason.md) / [closeCodeFor](/api/@graphorin/protocol/close-codes/functions/closeCodeFor.md).

## Stable
