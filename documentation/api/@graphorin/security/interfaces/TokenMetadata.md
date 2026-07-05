[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenMetadata

# Interface: TokenMetadata

Defined in: packages/security/src/auth/crud.ts:270

Public-safe metadata view of a token. The HMAC hash and pepper are
never surfaced.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | packages/security/src/auth/crud.ts:274 |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` | packages/security/src/auth/crud.ts:275 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/security/src/auth/crud.ts:271 |
| <a id="property-label"></a> `label?` | `readonly` | `string` | packages/security/src/auth/crud.ts:272 |
| <a id="property-lastusedat"></a> `lastUsedAt?` | `readonly` | `string` | packages/security/src/auth/crud.ts:277 |
| <a id="property-revokedat"></a> `revokedAt?` | `readonly` | `string` | packages/security/src/auth/crud.ts:276 |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly `string`[] | packages/security/src/auth/crud.ts:273 |
