[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuthAuditActor

# Interface: AuthAuditActor

Defined in: packages/security/src/auth/audit-emitter.ts:32

Optional pointer to who initiated the event.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | `string` | packages/security/src/auth/audit-emitter.ts:34 |
| <a id="property-kind"></a> `kind` | `readonly` | `"token"` \| `"cli"` \| `"agent"` \| `"tool"` \| `"system"` \| `"subagent"` | packages/security/src/auth/audit-emitter.ts:33 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | packages/security/src/auth/audit-emitter.ts:35 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | packages/security/src/auth/audit-emitter.ts:36 |
