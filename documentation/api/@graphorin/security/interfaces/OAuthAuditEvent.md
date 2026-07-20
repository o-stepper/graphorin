[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthAuditEvent

# Interface: OAuthAuditEvent

Defined in: packages/security/src/oauth/audit-emitter.ts:49

**`Stable`**

One audit event. The payload is intentionally minimal - no token
material - only safe metadata (server identifier, scope, expiry,
registration kind).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`OAuthAuditAction`](/api/@graphorin/security/type-aliases/OAuthAuditAction.md) | - | packages/security/src/oauth/audit-emitter.ts:50 |
| <a id="property-actor"></a> `actor?` | `readonly` | [`OAuthAuditActor`](/api/@graphorin/security/interfaces/OAuthAuditActor.md) | - | packages/security/src/oauth/audit-emitter.ts:57 |
| <a id="property-decision"></a> `decision` | `readonly` | [`OAuthAuditDecision`](/api/@graphorin/security/type-aliases/OAuthAuditDecision.md) | - | packages/security/src/oauth/audit-emitter.ts:51 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | packages/security/src/oauth/audit-emitter.ts:58 |
| <a id="property-source"></a> `source` | `readonly` | `string` | Stable identifier of the OAuth subsystem (always `'oauth'`). | packages/security/src/oauth/audit-emitter.ts:54 |
| <a id="property-target"></a> `target` | `readonly` | `string` | Target follows the convention `mcp:<server-id>` for MCP servers. | packages/security/src/oauth/audit-emitter.ts:56 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | - | packages/security/src/oauth/audit-emitter.ts:52 |
