[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BridgeOAuthToAuditOptions

# Interface: BridgeOAuthToAuditOptions

Defined in: packages/security/src/audit/oauth-bridge.ts:19

**`Stable`**

Options accepted by [bridgeOAuthToAudit](/api/@graphorin/security/functions/bridgeOAuthToAudit.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-db"></a> `db` | `readonly` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) | packages/security/src/audit/oauth-bridge.ts:20 |
| <a id="property-onwriteerror"></a> `onWriteError?` | `readonly` | (`event`, `error`) => `void` | packages/security/src/audit/oauth-bridge.ts:21 |
