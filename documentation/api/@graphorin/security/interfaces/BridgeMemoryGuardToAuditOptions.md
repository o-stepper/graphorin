[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BridgeMemoryGuardToAuditOptions

# Interface: BridgeMemoryGuardToAuditOptions

Defined in: packages/security/src/audit/memory-guard-bridge.ts:24

**`Stable`**

Options accepted by `bridgeMemoryGuardToAudit(...)`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-db"></a> `db` | `readonly` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) | packages/security/src/audit/memory-guard-bridge.ts:25 |
| <a id="property-onwriteerror"></a> `onWriteError?` | `readonly` | (`event`, `error`) => `void` | packages/security/src/audit/memory-guard-bridge.ts:26 |
