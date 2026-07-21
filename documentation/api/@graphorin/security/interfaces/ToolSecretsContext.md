[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ToolSecretsContext

# Interface: ToolSecretsContext

Defined in: packages/security/src/secrets/acl.ts:18

**`Stable`**

Per-call context kept in `AsyncLocalStorage`. Carries the current
tool's allowlist, identifier, and run/session bookkeeping that the
audit log uses for attribution.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | Identifier of the agent owning the scope, if known. | packages/security/src/secrets/acl.ts:26 |
| <a id="property-parent"></a> `parent?` | `readonly` | `ToolSecretsContext` | Lightweight pointer to the parent scope, for sub-agent isolation. | packages/security/src/secrets/acl.ts:30 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | Stable identifier of the run that initiated this scope. | packages/security/src/secrets/acl.ts:22 |
| <a id="property-secretsallowed"></a> `secretsAllowed` | `readonly` | readonly `string`[] | Effective allowlist for the current scope. | packages/security/src/secrets/acl.ts:28 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | Identifier of the session, if known. | packages/security/src/secrets/acl.ts:24 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | Stable name of the currently-executing tool. | packages/security/src/secrets/acl.ts:20 |
