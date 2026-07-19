[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretsAuditEvent

# Interface: SecretsAuditEvent

Defined in: packages/security/src/secrets/audit-emitter.ts:54

**`Stable`**

One audit event. The payload is intentionally minimal - never carry
the secret value itself, only metadata that is safe to log
(resolver / store identifier, key name, actor pointer).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`SecretsAuditAction`](/api/@graphorin/security/type-aliases/SecretsAuditAction.md) | Discriminator. | packages/security/src/secrets/audit-emitter.ts:56 |
| <a id="property-actor"></a> `actor?` | `readonly` | [`SecretsAuditActor`](/api/@graphorin/security/interfaces/SecretsAuditActor.md) | Optional actor pointer. | packages/security/src/secrets/audit-emitter.ts:70 |
| <a id="property-decision"></a> `decision` | `readonly` | [`SecretsAuditDecision`](/api/@graphorin/security/type-aliases/SecretsAuditDecision.md) | Outcome. | packages/security/src/secrets/audit-emitter.ts:58 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | Optional structured metadata. Must be safe to log. | packages/security/src/secrets/audit-emitter.ts:72 |
| <a id="property-source"></a> `source` | `readonly` | `string` | Stable identifier of the SecretsStore / resolver that fired the event. | packages/security/src/secrets/audit-emitter.ts:62 |
| <a id="property-target"></a> `target` | `readonly` | `string` | Target of the action. For `secret:*` events this is the secret key; for `secrets:downgrade` events this is the kind of store the factory downgraded to (e.g. `'env'`). | packages/security/src/secrets/audit-emitter.ts:68 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | Epoch milliseconds at which the event fired. | packages/security/src/secrets/audit-emitter.ts:60 |
