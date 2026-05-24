[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / emitSupplyChainAudit

# Function: emitSupplyChainAudit()

```ts
function emitSupplyChainAudit(event): void;
```

Defined in: packages/security/src/supply-chain/audit-emitter.ts:80

Emit an event to every subscriber. Listeners that throw are
isolated.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`SupplyChainAuditEvent`](/api/@graphorin/security/interfaces/SupplyChainAuditEvent.md) |

## Returns

`void`

## Stable
