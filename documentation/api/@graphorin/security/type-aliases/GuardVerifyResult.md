[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / GuardVerifyResult

# Type Alias: GuardVerifyResult

```ts
type GuardVerifyResult = 
  | {
  ok: true;
  snapshot: MemorySnapshot;
  tier: MemoryGuardTier;
  verifyDurationUs: number;
}
  | {
  mismatched: ReadonlyArray<string>;
  ok: false;
  snapshot: MemorySnapshot;
  tier: MemoryGuardTier;
  verifyDurationUs: number;
};
```

Defined in: packages/security/src/guard/types.ts:51

**`Stable`**

Result returned by `Guard.verify(...)`. The `ok` discriminator
matches the rest of the package so callers can switch uniformly.
