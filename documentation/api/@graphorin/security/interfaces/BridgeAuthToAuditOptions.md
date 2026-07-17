[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BridgeAuthToAuditOptions

# Interface: BridgeAuthToAuditOptions

Defined in: [packages/security/src/audit/auth-bridge.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/auth-bridge.ts#L17)

Options for [bridgeAuthToAudit](/api/@graphorin/security/functions/bridgeAuthToAudit.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-db"></a> `db` | `readonly` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) | [packages/security/src/audit/auth-bridge.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/auth-bridge.ts#L18) |
| <a id="property-onwriteerror"></a> `onWriteError?` | `readonly` | (`event`, `error`) => `void` | [packages/security/src/audit/auth-bridge.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/auth-bridge.ts#L19) |
