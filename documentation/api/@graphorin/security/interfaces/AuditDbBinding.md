[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditDbBinding

# Interface: AuditDbBinding

Defined in: packages/security/src/audit/audit-db.ts:63

Shape of a registered binding. The factory is asynchronous so it
can perform the file-mode check, run the cipher self-test, and
write the `audit:db.opened` chain entry before returning.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | Human-readable description for diagnostics. | packages/security/src/audit/audit-db.ts:67 |
| <a id="property-id"></a> `id` | `readonly` | [`AuditDbBindingId`](/api/@graphorin/security/type-aliases/AuditDbBindingId.md) | Identifier of the binding. | packages/security/src/audit/audit-db.ts:65 |
| <a id="property-open"></a> `open` | `readonly` | (`options`) => `Promise`\&lt;[`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md)\&gt; | Open the audit database. | packages/security/src/audit/audit-db.ts:69 |
