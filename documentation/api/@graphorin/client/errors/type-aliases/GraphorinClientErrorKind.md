[**Graphorin API reference v0.12.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [errors](/api/@graphorin/client/errors/index.md) / GraphorinClientErrorKind

# Type Alias: GraphorinClientErrorKind

```ts
type GraphorinClientErrorKind = 
  | "client-not-connected"
  | "transport-failed"
  | "subprotocol-mismatch"
  | "auth-failed"
  | "protocol-violation"
  | "subscription-not-found"
  | "rate-limited"
  | "scope-denied"
  | "run-not-found"
  | "server-error"
  | "aborted"
  | "flow-overflow"
  | "invalid-server-frame";
```

Defined in: [packages/client/src/errors.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/errors.ts#L45)

Discriminator union of every error kind raised by the client.

## Stable
