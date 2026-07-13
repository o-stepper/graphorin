[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuthAuditActor

# Interface: AuthAuditActor

Defined in: [packages/security/src/auth/audit-emitter.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L32)

Optional pointer to who initiated the event.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | `string` | [packages/security/src/auth/audit-emitter.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L34) |
| <a id="property-kind"></a> `kind` | `readonly` | `"token"` \| `"cli"` \| `"agent"` \| `"tool"` \| `"system"` \| `"subagent"` | [packages/security/src/auth/audit-emitter.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L33) |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | [packages/security/src/auth/audit-emitter.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L35) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | [packages/security/src/auth/audit-emitter.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L36) |
