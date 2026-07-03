[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthSession

# Interface: OAuthSession

Defined in: packages/security/src/oauth/types.ts:149

Live OAuth session. The `accessToken` is wrapped in [SecretValue](/api/@graphorin/security/classes/SecretValue.md)
even in memory so the standard leakage barriers apply if it ever
escapes into a log line.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-accesstoken"></a> `accessToken` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | packages/security/src/oauth/types.ts:151 |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `number` | packages/security/src/oauth/types.ts:156 |
| <a id="property-idtoken"></a> `idToken?` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | packages/security/src/oauth/types.ts:153 |
| <a id="property-issuedat"></a> `issuedAt` | `readonly` | `number` | packages/security/src/oauth/types.ts:157 |
| <a id="property-refreshtoken"></a> `refreshToken?` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | packages/security/src/oauth/types.ts:152 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | packages/security/src/oauth/types.ts:155 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | packages/security/src/oauth/types.ts:150 |
| <a id="property-tokentype"></a> `tokenType` | `readonly` | `string` | packages/security/src/oauth/types.ts:154 |
