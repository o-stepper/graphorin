[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onSupplyChainAudit

# Function: onSupplyChainAudit()

```ts
function onSupplyChainAudit(listener): () => void;
```

Defined in: packages/security/src/supply-chain/audit-emitter.ts:67

Subscribe to supply-chain audit events. The audit-log subsystem
registers exactly one listener.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | `SupplyChainAuditListener` |

## Returns

() => `void`

## Stable
