[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Sensitivity

# Type Alias: Sensitivity

```ts
type Sensitivity = "public" | "internal" | "secret";
```

Defined in: packages/core/src/types/sensitivity.ts:13

Sensitivity tier for any piece of data flowing through Graphorin.

- `'public'`   — non-sensitive content; safe for any provider, any sink.
- `'internal'` — default for user-generated content; safe for trusted
  providers (loopback / private-network) but redacted for public-tls
  exporters and replay consumers.
- `'secret'`   — credentials, tokens, encryption keys; only ever stays
  in-process and is never serialized to the wire by default.

## Stable
