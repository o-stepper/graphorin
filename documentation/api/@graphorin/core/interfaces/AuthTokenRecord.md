[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AuthTokenRecord

# Interface: AuthTokenRecord

Defined in: [packages/core/src/contracts/auth-token-store.ts:8](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L8)

Persisted server auth token record. Holds a per-token HMAC hash + scope
grammar; raw tokens are never persisted (the runtime carries them via
`SecretValue`).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | [packages/core/src/contracts/auth-token-store.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L17) |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` | - | [packages/core/src/contracts/auth-token-store.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L18) |
| <a id="property-hashhex"></a> `hashHex` | `readonly` | `string` | HMAC-SHA256 of the secret part, peppered. Hex-encoded. | [packages/core/src/contracts/auth-token-store.ts:12](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L12) |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable identifier (the public part of the token, before the secret). | [packages/core/src/contracts/auth-token-store.ts:10](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L10) |
| <a id="property-label"></a> `label?` | `readonly` | `string` | Optional human-readable label rendered in CLI listings. | [packages/core/src/contracts/auth-token-store.ts:14](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L14) |
| <a id="property-lastusedat"></a> `lastUsedAt?` | `readonly` | `string` | - | [packages/core/src/contracts/auth-token-store.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L20) |
| <a id="property-revokedat"></a> `revokedAt?` | `readonly` | `string` | - | [packages/core/src/contracts/auth-token-store.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L19) |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly `string`[] | Scope grammar - opaque strings of the form `<resource>:<action>[:<id-or-glob>]`. | [packages/core/src/contracts/auth-token-store.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/auth-token-store.ts#L16) |
