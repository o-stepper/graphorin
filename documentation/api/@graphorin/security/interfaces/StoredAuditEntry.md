[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / StoredAuditEntry

# Interface: StoredAuditEntry

Defined in: packages/security/src/audit/types.ts:122

Concrete on-disk audit entry. The `hash` and `prev_hash` fields are
always 64-char hex SHA-256 digests.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`AuditAction`](/api/@graphorin/security/type-aliases/AuditAction.md) | packages/security/src/audit/types.ts:126 |
| <a id="property-actor"></a> `actor` | `readonly` | [`AuditActor`](/api/@graphorin/security/interfaces/AuditActor.md) | packages/security/src/audit/types.ts:125 |
| <a id="property-context"></a> `context?` | `readonly` | [`AuditContext`](/api/@graphorin/security/interfaces/AuditContext.md) | packages/security/src/audit/types.ts:129 |
| <a id="property-decision"></a> `decision` | `readonly` | [`AuditDecision`](/api/@graphorin/security/type-aliases/AuditDecision.md) | packages/security/src/audit/types.ts:128 |
| <a id="property-hash"></a> `hash` | `readonly` | `string` | packages/security/src/audit/types.ts:132 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\<`string`, `unknown`\>\> | packages/security/src/audit/types.ts:130 |
| <a id="property-prevhash"></a> `prevHash` | `readonly` | `string` | packages/security/src/audit/types.ts:131 |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | packages/security/src/audit/types.ts:123 |
| <a id="property-target"></a> `target` | `readonly` | `string` | packages/security/src/audit/types.ts:127 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | packages/security/src/audit/types.ts:124 |
