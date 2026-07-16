[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditContext

# Interface: AuditContext

Defined in: [packages/security/src/audit/types.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/types.ts#L90)

Optional context surfaced alongside an audit entry. Each field is
filtered to safe metadata (no raw secret values) by the calling
site.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | [packages/security/src/audit/types.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/types.ts#L91) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | [packages/security/src/audit/types.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/types.ts#L92) |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | [packages/security/src/audit/types.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/types.ts#L93) |
