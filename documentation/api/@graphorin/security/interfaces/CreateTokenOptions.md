[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / CreateTokenOptions

# Interface: CreateTokenOptions

Defined in: packages/security/src/auth/crud.ts:29

**`Stable`**

Options for `createToken(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-env"></a> `env` | `readonly` | `string` | - | packages/security/src/auth/crud.ts:32 |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `number` \| `Date` | Optional explicit expiry as a Date or epoch ms. | packages/security/src/auth/crud.ts:39 |
| <a id="property-expiresinms"></a> `expiresInMs?` | `readonly` | `number` | Optional millisecond-precision expiry. Mutually exclusive with `expiresAt`. | packages/security/src/auth/crud.ts:37 |
| <a id="property-idoverride"></a> `idOverride?` | `readonly` | `string` | Optional id override (used by `rotateToken`); defaults to a random UUID. | packages/security/src/auth/crud.ts:41 |
| <a id="property-label"></a> `label?` | `readonly` | `string` | - | packages/security/src/auth/crud.ts:34 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall-clock provider for tests. Defaults to `Date.now`. | packages/security/src/auth/crud.ts:43 |
| <a id="property-pepper"></a> `pepper` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | - | packages/security/src/auth/crud.ts:31 |
| <a id="property-prefix"></a> `prefix?` | `readonly` | `string` | - | packages/security/src/auth/crud.ts:35 |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly `string`[] | - | packages/security/src/auth/crud.ts:33 |
| <a id="property-tokenstore"></a> `tokenStore` | `readonly` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) | - | packages/security/src/auth/crud.ts:30 |
