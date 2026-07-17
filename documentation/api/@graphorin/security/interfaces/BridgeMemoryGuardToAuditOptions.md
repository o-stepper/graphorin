[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BridgeMemoryGuardToAuditOptions

# Interface: BridgeMemoryGuardToAuditOptions

Defined in: [packages/security/src/audit/memory-guard-bridge.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/memory-guard-bridge.ts#L24)

Options accepted by `bridgeMemoryGuardToAudit(...)`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-db"></a> `db` | `readonly` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) | [packages/security/src/audit/memory-guard-bridge.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/memory-guard-bridge.ts#L25) |
| <a id="property-onwriteerror"></a> `onWriteError?` | `readonly` | (`event`, `error`) => `void` | [packages/security/src/audit/memory-guard-bridge.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/memory-guard-bridge.ts#L26) |
