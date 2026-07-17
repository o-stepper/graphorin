[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthSession

# Interface: OAuthSession

Defined in: [packages/security/src/oauth/types.ts:149](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L149)

Live OAuth session. The `accessToken` is wrapped in [SecretValue](/api/@graphorin/security/classes/SecretValue.md)
even in memory so the standard leakage barriers apply if it ever
escapes into a log line.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-accesstoken"></a> `accessToken` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | [packages/security/src/oauth/types.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L151) |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `number` | [packages/security/src/oauth/types.ts:156](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L156) |
| <a id="property-idtoken"></a> `idToken?` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | [packages/security/src/oauth/types.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L153) |
| <a id="property-issuedat"></a> `issuedAt` | `readonly` | `number` | [packages/security/src/oauth/types.ts:157](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L157) |
| <a id="property-refreshtoken"></a> `refreshToken?` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | [packages/security/src/oauth/types.ts:152](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L152) |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | [packages/security/src/oauth/types.ts:155](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L155) |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | [packages/security/src/oauth/types.ts:150](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L150) |
| <a id="property-tokentype"></a> `tokenType` | `readonly` | `string` | [packages/security/src/oauth/types.ts:154](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L154) |
