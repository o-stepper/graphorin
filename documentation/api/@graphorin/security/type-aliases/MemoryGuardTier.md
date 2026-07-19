[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MemoryGuardTier

# Type Alias: MemoryGuardTier

```ts
type MemoryGuardTier = 
  | "pure"
  | "side-effecting-no-memory"
  | "memory-aware"
  | "unknown"
  | "untrusted";
```

Defined in: packages/security/src/guard/types.ts:23

**`Stable`**

Discriminator for memory-tier classification per DEC-153.
