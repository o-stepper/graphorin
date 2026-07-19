[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / VerifyResult

# Type Alias: VerifyResult

```ts
type VerifyResult = 
  | {
  ok: true;
  token: VerifiedToken;
}
  | {
  ok: false;
  reason: VerifyFailureReason;
  retryAfterMs?: number;
};
```

Defined in: packages/security/src/auth/verify.ts:60

**`Stable`**

Discriminated result of a verify call. The pipeline never throws
on the unhappy path so callers can map `reason` directly to an
HTTP status code without try/catch in their hot path.
