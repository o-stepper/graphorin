[**Graphorin API reference v0.10.1**](../../../index.md)

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

Defined in: [packages/security/src/guard/types.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/types.ts#L51)

Result returned by `Guard.verify(...)`. The `ok` discriminator
matches the rest of the package so callers can switch uniformly.

## Stable
