[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenMetadata

# Interface: TokenMetadata

Defined in: packages/security/src/auth/crud.ts:277

Public-safe metadata view of a token. The HMAC hash and pepper are
never surfaced.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | packages/security/src/auth/crud.ts:281 |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` | packages/security/src/auth/crud.ts:282 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/security/src/auth/crud.ts:278 |
| <a id="property-label"></a> `label?` | `readonly` | `string` | packages/security/src/auth/crud.ts:279 |
| <a id="property-lastusedat"></a> `lastUsedAt?` | `readonly` | `string` | packages/security/src/auth/crud.ts:284 |
| <a id="property-revokedat"></a> `revokedAt?` | `readonly` | `string` | packages/security/src/auth/crud.ts:283 |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly `string`[] | packages/security/src/auth/crud.ts:280 |
