[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MemoryGuardAuditEvent

# Interface: MemoryGuardAuditEvent

Defined in: packages/security/src/guard/audit-emitter.ts:71

**`Stable`**

One audit event. The payload never contains the raw contents of a
memory region - only the digest, the region name, and the actor.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`MemoryGuardAuditAction`](/api/@graphorin/security/type-aliases/MemoryGuardAuditAction.md) | - | packages/security/src/guard/audit-emitter.ts:72 |
| <a id="property-actor"></a> `actor?` | `readonly` | [`MemoryGuardActor`](/api/@graphorin/security/interfaces/MemoryGuardActor.md) | Optional actor pointer. | packages/security/src/guard/audit-emitter.ts:81 |
| <a id="property-decision"></a> `decision` | `readonly` | [`MemoryGuardDecision`](/api/@graphorin/security/type-aliases/MemoryGuardDecision.md) | - | packages/security/src/guard/audit-emitter.ts:73 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | Optional structured metadata. Must be safe to log. | packages/security/src/guard/audit-emitter.ts:83 |
| <a id="property-regions"></a> `regions?` | `readonly` | readonly `string`[] | Mismatched region names (only populated on mismatch / rollback). | packages/security/src/guard/audit-emitter.ts:79 |
| <a id="property-tier"></a> `tier` | `readonly` | [`MemoryGuardTier`](/api/@graphorin/security/type-aliases/MemoryGuardTier.md) | Stable identifier of the guard tier that fired the event. | packages/security/src/guard/audit-emitter.ts:77 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | Epoch milliseconds at which the event fired. | packages/security/src/guard/audit-emitter.ts:75 |
