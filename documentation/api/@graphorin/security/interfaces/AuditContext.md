[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditContext

# Interface: AuditContext

Defined in: packages/security/src/audit/types.ts:90

**`Stable`**

Optional context surfaced alongside an audit entry. Each field is
filtered to safe metadata (no raw secret values) by the calling
site.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | packages/security/src/audit/types.ts:91 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | packages/security/src/audit/types.ts:92 |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | packages/security/src/audit/types.ts:93 |
