[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [errors](/api/@graphorin/sessions/errors/index.md) / SessionErrorCode

# Type Alias: SessionErrorCode

```ts
type SessionErrorCode = 
  | "replay-access-denied"
  | "cassette-idempotency-mismatch"
  | "cassette-schema-mismatch"
  | "cassette-artifact-missing"
  | "cassette-cursor-violation"
  | "cassette-format-invalid"
  | "session-export-format-invalid"
  | "session-export-schema-too-new"
  | "session-export-schema-unsupported"
  | "session-export-checksum-mismatch"
  | "session-export-encryption-required"
  | "session-not-found"
  | "session-closed"
  | "agent-not-found"
  | "invalid-commentary-policy";
```

Defined in: packages/sessions/src/errors/index.ts:16

**`Stable`**

Stable code discriminator surfaced on every [SessionError](/api/@graphorin/sessions/errors/classes/SessionError.md).
