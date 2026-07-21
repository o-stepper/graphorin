[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SupplyChainAuditAction

# Type Alias: SupplyChainAuditAction

```ts
type SupplyChainAuditAction = 
  | "skill:installed"
  | "skill:upgraded"
  | "skill:removed"
  | "skill:audit"
  | "skill:install-denied";
```

Defined in: packages/security/src/supply-chain/audit-emitter.ts:15

**`Stable`**

Discriminator for `SupplyChainAuditEvent`.
