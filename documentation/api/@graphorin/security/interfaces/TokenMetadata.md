[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenMetadata

# Interface: TokenMetadata

Defined in: [packages/security/src/auth/crud.ts:270](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L270)

Public-safe metadata view of a token. The HMAC hash and pepper are
never surfaced.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | [packages/security/src/auth/crud.ts:274](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L274) |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` | [packages/security/src/auth/crud.ts:275](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L275) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/security/src/auth/crud.ts:271](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L271) |
| <a id="property-label"></a> `label?` | `readonly` | `string` | [packages/security/src/auth/crud.ts:272](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L272) |
| <a id="property-lastusedat"></a> `lastUsedAt?` | `readonly` | `string` | [packages/security/src/auth/crud.ts:277](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L277) |
| <a id="property-revokedat"></a> `revokedAt?` | `readonly` | `string` | [packages/security/src/auth/crud.ts:276](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L276) |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly `string`[] | [packages/security/src/auth/crud.ts:273](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L273) |
