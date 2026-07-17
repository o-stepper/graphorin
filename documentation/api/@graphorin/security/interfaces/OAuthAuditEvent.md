[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthAuditEvent

# Interface: OAuthAuditEvent

Defined in: [packages/security/src/oauth/audit-emitter.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L49)

One audit event. The payload is intentionally minimal - no token
material - only safe metadata (server identifier, scope, expiry,
registration kind).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`OAuthAuditAction`](/api/@graphorin/security/type-aliases/OAuthAuditAction.md) | - | [packages/security/src/oauth/audit-emitter.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L50) |
| <a id="property-actor"></a> `actor?` | `readonly` | [`OAuthAuditActor`](/api/@graphorin/security/interfaces/OAuthAuditActor.md) | - | [packages/security/src/oauth/audit-emitter.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L57) |
| <a id="property-decision"></a> `decision` | `readonly` | [`OAuthAuditDecision`](/api/@graphorin/security/type-aliases/OAuthAuditDecision.md) | - | [packages/security/src/oauth/audit-emitter.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L51) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | [packages/security/src/oauth/audit-emitter.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L58) |
| <a id="property-source"></a> `source` | `readonly` | `string` | Stable identifier of the OAuth subsystem (always `'oauth'`). | [packages/security/src/oauth/audit-emitter.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L54) |
| <a id="property-target"></a> `target` | `readonly` | `string` | Target follows the convention `mcp:<server-id>` for MCP servers. | [packages/security/src/oauth/audit-emitter.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L56) |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | - | [packages/security/src/oauth/audit-emitter.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L52) |
