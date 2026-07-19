[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MemoryGuardActor

# Interface: MemoryGuardActor

Defined in: packages/security/src/guard/audit-emitter.ts:57

**`Stable`**

Optional actor pointer. The secrets / agent layer supplies the
tool name and the current run / session id so the audit log can
attribute the event without inventing identities.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | `string` | packages/security/src/guard/audit-emitter.ts:59 |
| <a id="property-kind"></a> `kind` | `readonly` | `"agent"` \| `"tool"` \| `"system"` \| `"subagent"` | packages/security/src/guard/audit-emitter.ts:58 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | packages/security/src/guard/audit-emitter.ts:61 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | packages/security/src/guard/audit-emitter.ts:62 |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | packages/security/src/guard/audit-emitter.ts:60 |
