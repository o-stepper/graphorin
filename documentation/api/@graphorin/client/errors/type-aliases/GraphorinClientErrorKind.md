[**Graphorin API reference v0.1.0**](../../../../index.md)

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
  | "aborted"
  | "invalid-server-frame";
```

Defined in: packages/client/src/errors.ts:16

Discriminator union of every error kind raised by the client.

## Stable
