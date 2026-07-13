[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthAuditActor

# Interface: OAuthAuditActor

Defined in: [packages/security/src/oauth/audit-emitter.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L37)

Optional identifier of who initiated the event. Forwarded by the
library functions / CLI so the audit log records the correct
actor.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | `string` | [packages/security/src/oauth/audit-emitter.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L39) |
| <a id="property-kind"></a> `kind` | `readonly` | `"cli"` \| `"agent"` \| `"tool"` \| `"system"` \| `"subagent"` | [packages/security/src/oauth/audit-emitter.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/audit-emitter.ts#L38) |
