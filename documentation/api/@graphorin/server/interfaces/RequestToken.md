[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RequestToken

# Interface: RequestToken

Defined in: packages/server/src/internal/context.ts:60

**`Stable`**

Convenience snapshot of the verified token surfaced on `c.var.token`
once the auth middleware has resolved the bearer credential. Mirrors
the contract documented in the runtime architecture (Phase 14a §
Authentication / authorization middleware: "populates `c.var.token:
{ id, label, scopes, env }`").

Read this through `getRequestToken` so consumers do not have
to remember the variable key.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-env"></a> `env` | `readonly` | `string` | packages/server/src/internal/context.ts:64 |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | `number` \| `undefined` | packages/server/src/internal/context.ts:65 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/server/src/internal/context.ts:61 |
| <a id="property-label"></a> `label` | `readonly` | `string` \| `undefined` | packages/server/src/internal/context.ts:62 |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)[] | packages/server/src/internal/context.ts:63 |
