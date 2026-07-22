[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditEntryInput

# Interface: AuditEntryInput

Defined in: packages/security/src/audit/types.ts:102

**`Stable`**

Input to `appendAudit(...)`. Callers do not provide `seq`,
`prev_hash`, or `hash`; those are computed by the helper.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`AuditAction`](/api/@graphorin/security/type-aliases/AuditAction.md) | - | packages/security/src/audit/types.ts:104 |
| <a id="property-actor"></a> `actor` | `readonly` | [`AuditActor`](/api/@graphorin/security/interfaces/AuditActor.md) | - | packages/security/src/audit/types.ts:103 |
| <a id="property-context"></a> `context?` | `readonly` | [`AuditContext`](/api/@graphorin/security/interfaces/AuditContext.md) | - | packages/security/src/audit/types.ts:107 |
| <a id="property-decision"></a> `decision` | `readonly` | [`AuditDecision`](/api/@graphorin/security/type-aliases/AuditDecision.md) | - | packages/security/src/audit/types.ts:106 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | packages/security/src/audit/types.ts:108 |
| <a id="property-target"></a> `target` | `readonly` | `string` | - | packages/security/src/audit/types.ts:105 |
| <a id="property-ts"></a> `ts?` | `readonly` | `number` | Override the timestamp. Defaults to `Date.now()`. Tests pass a deterministic value here; production code never sets this. | packages/security/src/audit/types.ts:113 |
