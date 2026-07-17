[**Graphorin API reference v0.10.2**](../../../index.md)

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

Defined in: [packages/security/src/supply-chain/audit-emitter.ts:15](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit-emitter.ts#L15)

Discriminator for `SupplyChainAuditEvent`.

## Stable
