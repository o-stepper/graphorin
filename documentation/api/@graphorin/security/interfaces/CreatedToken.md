[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / CreatedToken

# Interface: CreatedToken

Defined in: packages/security/src/auth/crud.ts:52

**`Stable`**

Result of `createToken(...)`. The raw token is a `SecretValue` so it
is never accidentally logged on the way back to the caller.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-raw"></a> `raw` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | packages/security/src/auth/crud.ts:53 |
| <a id="property-record"></a> `record` | `readonly` | [`AuthTokenRecord`](/api/@graphorin/core/interfaces/AuthTokenRecord.md) | packages/security/src/auth/crud.ts:54 |
