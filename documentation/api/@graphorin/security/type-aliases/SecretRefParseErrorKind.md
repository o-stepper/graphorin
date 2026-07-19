[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretRefParseErrorKind

# Type Alias: SecretRefParseErrorKind

```ts
type SecretRefParseErrorKind = 
  | "empty-input"
  | "malformed-uri"
  | "invalid-scheme"
  | "unknown-scheme"
  | "missing-authority"
  | "unexpected-authority"
  | "empty-path"
  | "invalid-percent-encoding"
  | "naked-string";
```

Defined in: packages/security/src/secrets/errors.ts:37

**`Stable`**

Discriminator union for `SecretRefParseError`. Lets callers branch on
the failure mode without parsing the message string.
