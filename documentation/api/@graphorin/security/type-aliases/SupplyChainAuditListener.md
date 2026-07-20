[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SupplyChainAuditListener

# Type Alias: SupplyChainAuditListener

```ts
type SupplyChainAuditListener = (event) => void;
```

Defined in: packages/security/src/supply-chain/audit-emitter.ts:62

**`Stable`**

Callback shape accepted by [onSupplyChainAudit](/api/@graphorin/security/functions/onSupplyChainAudit.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`SupplyChainAuditEvent`](/api/@graphorin/security/interfaces/SupplyChainAuditEvent.md) |

## Returns

`void`
