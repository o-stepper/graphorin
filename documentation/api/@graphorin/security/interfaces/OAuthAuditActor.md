[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthAuditActor

# Interface: OAuthAuditActor

Defined in: packages/security/src/oauth/audit-emitter.ts:37

**`Stable`**

Optional identifier of who initiated the event. Forwarded by the
library functions / CLI so the audit log records the correct
actor.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | `string` | packages/security/src/oauth/audit-emitter.ts:39 |
| <a id="property-kind"></a> `kind` | `readonly` | `"cli"` \| `"agent"` \| `"tool"` \| `"system"` \| `"subagent"` | packages/security/src/oauth/audit-emitter.ts:38 |
