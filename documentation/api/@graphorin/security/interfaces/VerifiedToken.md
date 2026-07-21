[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / VerifiedToken

# Interface: VerifiedToken

Defined in: packages/security/src/auth/verify.ts:45

**`Stable`**

Result of a successful `verifyToken(...)` call. The shape is the
minimum that callers (HTTP middleware, RPC handlers, CLI auth)
need to make an authorization decision.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-env"></a> `env` | `readonly` | `string` | packages/security/src/auth/verify.ts:49 |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `number` | packages/security/src/auth/verify.ts:50 |
| <a id="property-label"></a> `label?` | `readonly` | `string` | packages/security/src/auth/verify.ts:47 |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)[] | packages/security/src/auth/verify.ts:48 |
| <a id="property-tokenid"></a> `tokenId` | `readonly` | `string` | packages/security/src/auth/verify.ts:46 |
