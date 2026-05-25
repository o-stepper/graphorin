[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / WithSecretAuditEvent

# Interface: WithSecretAuditEvent

Defined in: packages/security/src/secrets/acl.ts:120

Mirror of the `@graphorin/core` audit emitter contract for secret
unwrap events. Sub-package 03b subscribes through `onSecretValueAudit`
(see `secret-value.ts`); the ACL layer additionally emits **scope**
events for each `withSecret(...)` invocation.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | `"with-secret"` | packages/security/src/secrets/acl.ts:121 |
| <a id="property-caller"></a> `caller?` | `readonly` | `string` | packages/security/src/secrets/acl.ts:124 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/security/src/secrets/acl.ts:125 |
| <a id="property-scopeid"></a> `scopeId` | `readonly` | `string` | packages/security/src/secrets/acl.ts:123 |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | packages/security/src/secrets/acl.ts:122 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | packages/security/src/secrets/acl.ts:126 |
