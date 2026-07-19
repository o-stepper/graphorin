[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / VerifyFailureReason

# Type Alias: VerifyFailureReason

```ts
type VerifyFailureReason = 
  | "malformed"
  | "unknown-token"
  | "revoked"
  | "expired"
  | "ip-locked-out"
  | "token-locked-out";
```

Defined in: packages/security/src/auth/verify.ts:70

**`Stable`**

Reasons a verify call can fail. Each value is a stable lowercase
discriminator suitable for direct logging.
