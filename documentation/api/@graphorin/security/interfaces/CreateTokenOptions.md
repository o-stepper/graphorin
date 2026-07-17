[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / CreateTokenOptions

# Interface: CreateTokenOptions

Defined in: [packages/security/src/auth/crud.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L29)

Options for `createToken(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-env"></a> `env` | `readonly` | `string` | - | [packages/security/src/auth/crud.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L32) |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `number` \| `Date` | Optional explicit expiry as a Date or epoch ms. | [packages/security/src/auth/crud.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L39) |
| <a id="property-expiresinms"></a> `expiresInMs?` | `readonly` | `number` | Optional millisecond-precision expiry. Mutually exclusive with `expiresAt`. | [packages/security/src/auth/crud.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L37) |
| <a id="property-idoverride"></a> `idOverride?` | `readonly` | `string` | Optional id override (used by `rotateToken`); defaults to a random UUID. | [packages/security/src/auth/crud.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L41) |
| <a id="property-label"></a> `label?` | `readonly` | `string` | - | [packages/security/src/auth/crud.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L34) |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall-clock provider for tests. Defaults to `Date.now`. | [packages/security/src/auth/crud.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L43) |
| <a id="property-pepper"></a> `pepper` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | - | [packages/security/src/auth/crud.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L31) |
| <a id="property-prefix"></a> `prefix?` | `readonly` | `string` | - | [packages/security/src/auth/crud.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L35) |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly `string`[] | - | [packages/security/src/auth/crud.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L33) |
| <a id="property-tokenstore"></a> `tokenStore` | `readonly` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) | - | [packages/security/src/auth/crud.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L30) |
