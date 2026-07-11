[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / VerifiedToken

# Interface: VerifiedToken

Defined in: [packages/security/src/auth/verify.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/verify.ts#L45)

Result of a successful `verifyToken(...)` call. The shape is the
minimum that callers (HTTP middleware, RPC handlers, CLI auth)
need to make an authorization decision.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-env"></a> `env` | `readonly` | `string` | [packages/security/src/auth/verify.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/verify.ts#L49) |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `number` | [packages/security/src/auth/verify.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/verify.ts#L50) |
| <a id="property-label"></a> `label?` | `readonly` | `string` | [packages/security/src/auth/verify.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/verify.ts#L47) |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)[] | [packages/security/src/auth/verify.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/verify.ts#L48) |
| <a id="property-tokenid"></a> `tokenId` | `readonly` | `string` | [packages/security/src/auth/verify.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/verify.ts#L46) |
