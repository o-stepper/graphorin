[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuthAuditEvent

# Interface: AuthAuditEvent

Defined in: [packages/security/src/auth/audit-emitter.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L45)

One auth audit event. The payload never carries the raw token or the
pepper - only the token id / metadata safe to log.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`AuthAuditAction`](/api/@graphorin/security/type-aliases/AuthAuditAction.md) | - | [packages/security/src/auth/audit-emitter.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L46) |
| <a id="property-actor"></a> `actor?` | `readonly` | [`AuthAuditActor`](/api/@graphorin/security/interfaces/AuthAuditActor.md) | - | [packages/security/src/auth/audit-emitter.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L51) |
| <a id="property-decision"></a> `decision` | `readonly` | [`AuthAuditDecision`](/api/@graphorin/security/type-aliases/AuthAuditDecision.md) | - | [packages/security/src/auth/audit-emitter.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L47) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | Bounded, secret-free context (scopes, ip, reason). | [packages/security/src/auth/audit-emitter.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L53) |
| <a id="property-target"></a> `target` | `readonly` | `string` | Token id (`token:*`) or the failure subject (`auth:denied:*`). | [packages/security/src/auth/audit-emitter.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L50) |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | - | [packages/security/src/auth/audit-emitter.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L48) |
