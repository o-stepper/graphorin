[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditActor

# Interface: AuditActor

Defined in: packages/security/src/audit/types.ts:20

**`Stable`**

Pointer to who initiated an audited action. The audit log never
stores the secret value itself; only metadata that is safe to log.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/security/src/audit/types.ts:22 |
| <a id="property-kind"></a> `kind` | `readonly` | [`AuditActorKind`](/api/@graphorin/security/type-aliases/AuditActorKind.md) | packages/security/src/audit/types.ts:21 |
| <a id="property-label"></a> `label?` | `readonly` | `string` | packages/security/src/audit/types.ts:23 |
