[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [errors](/api/@graphorin/server/errors/index.md) / GraphorinServerErrorCode

# Type Alias: GraphorinServerErrorCode

```ts
type GraphorinServerErrorCode = 
  | "config-invalid"
  | "pre-bind-pepper-missing"
  | "pre-bind-secret-unresolvable"
  | "pre-bind-encryption-peer-missing"
  | "pre-bind-encryption-required"
  | "migration-failed"
  | "shutdown-timeout"
  | "idempotency-conflict"
  | "idempotency-key-required"
  | "auth-required"
  | "auth-invalid"
  | "auth-revoked"
  | "auth-expired"
  | "auth-locked-out"
  | "auth-overloaded"
  | "scope-denied"
  | "csrf-denied"
  | "cors-denied"
  | "rate-limit-exceeded"
  | "route-handler-missing"
  | "agent-not-found"
  | "workflow-not-found"
  | "session-not-found"
  | "run-not-found"
  | "run-aborted"
  | "lifecycle-double-start"
  | "lifecycle-not-started";
```

Defined in: packages/server/src/errors/index.ts:18

Stable string discriminator for [GraphorinServerError](/api/@graphorin/server/errors/classes/GraphorinServerError.md). Each
value maps to a single failure scenario; never reuse a value for a
different cause.

## Stable
