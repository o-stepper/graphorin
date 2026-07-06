[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / CreatedToken

# Interface: CreatedToken

Defined in: [packages/security/src/auth/crud.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L52)

Result of `createToken(...)`. The raw token is a `SecretValue` so it
is never accidentally logged on the way back to the caller.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-raw"></a> `raw` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | [packages/security/src/auth/crud.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L53) |
| <a id="property-record"></a> `record` | `readonly` | [`AuthTokenRecord`](/api/@graphorin/core/interfaces/AuthTokenRecord.md) | [packages/security/src/auth/crud.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L54) |
