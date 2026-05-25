[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / CreateGuardOptions

# Type Alias: CreateGuardOptions

```ts
type CreateGuardOptions = 
  | {
  tier: "pure";
}
  | {
  tier: "side-effecting-no-memory";
}
  | {
  tier: "memory-aware";
} & ApiBoundaryGuardOptions
  | {
  tier: "unknown";
} & AuditOnlyGuardOptions
  | {
  tier: "untrusted";
} & StrictFullGuardOptions;
```

Defined in: packages/security/src/guard/factory.ts:20

Tier-tagged options union. `'memory-aware'` requires the call-path
recorder; the other tiers only take optional metadata.

## Stable
