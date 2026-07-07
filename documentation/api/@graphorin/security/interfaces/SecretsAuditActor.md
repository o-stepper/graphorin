[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretsAuditActor

# Interface: SecretsAuditActor

Defined in: [packages/security/src/secrets/audit-emitter.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/audit-emitter.ts#L39)

Optional identifier of who initiated the event. The secrets layer
never invents identities - it forwards whatever the per-tool ACL or
factory caller supplied.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | `string` | [packages/security/src/secrets/audit-emitter.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/audit-emitter.ts#L41) |
| <a id="property-kind"></a> `kind` | `readonly` | `"cli"` \| `"agent"` \| `"tool"` \| `"system"` \| `"subagent"` | [packages/security/src/secrets/audit-emitter.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/audit-emitter.ts#L40) |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | [packages/security/src/secrets/audit-emitter.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/audit-emitter.ts#L43) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | [packages/security/src/secrets/audit-emitter.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/audit-emitter.ts#L44) |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | [packages/security/src/secrets/audit-emitter.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/audit-emitter.ts#L42) |
