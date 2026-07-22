[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onSupplyChainAudit

# Function: onSupplyChainAudit()

```ts
function onSupplyChainAudit(listener): () => void;
```

Defined in: packages/security/src/supply-chain/audit-emitter.ts:72

**`Stable`**

Subscribe to supply-chain audit events. The audit-log subsystem
registers exactly one listener.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | [`SupplyChainAuditListener`](/api/@graphorin/security/type-aliases/SupplyChainAuditListener.md) |

## Returns

() => `void`
