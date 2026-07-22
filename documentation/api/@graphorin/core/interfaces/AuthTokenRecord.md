[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AuthTokenRecord

# Interface: AuthTokenRecord

Defined in: packages/core/src/contracts/auth-token-store.ts:8

**`Stable`**

Persisted server auth token record. Holds a per-token HMAC hash + scope
grammar; raw tokens are never persisted (the runtime carries them via
`SecretValue`).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | packages/core/src/contracts/auth-token-store.ts:17 |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` | - | packages/core/src/contracts/auth-token-store.ts:18 |
| <a id="property-hashhex"></a> `hashHex` | `readonly` | `string` | HMAC-SHA256 of the secret part, peppered. Hex-encoded. | packages/core/src/contracts/auth-token-store.ts:12 |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable identifier (the public part of the token, before the secret). | packages/core/src/contracts/auth-token-store.ts:10 |
| <a id="property-label"></a> `label?` | `readonly` | `string` | Optional human-readable label rendered in CLI listings. | packages/core/src/contracts/auth-token-store.ts:14 |
| <a id="property-lastusedat"></a> `lastUsedAt?` | `readonly` | `string` | - | packages/core/src/contracts/auth-token-store.ts:20 |
| <a id="property-revokedat"></a> `revokedAt?` | `readonly` | `string` | - | packages/core/src/contracts/auth-token-store.ts:19 |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly `string`[] | Scope grammar - opaque strings of the form `<resource>:<action>[:<id-or-glob>]`. | packages/core/src/contracts/auth-token-store.ts:16 |
