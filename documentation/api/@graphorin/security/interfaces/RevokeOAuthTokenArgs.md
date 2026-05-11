[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RevokeOAuthTokenArgs

# Interface: RevokeOAuthTokenArgs

Defined in: packages/security/src/oauth/refresh.ts:111

Internal arguments for the revoke helper.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-metadata"></a> `metadata` | `readonly` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) | packages/security/src/oauth/refresh.ts:113 |
| <a id="property-registration"></a> `registration` | `readonly` | [`OAuthRegistration`](/api/@graphorin/security/interfaces/OAuthRegistration.md) | packages/security/src/oauth/refresh.ts:114 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | packages/security/src/oauth/refresh.ts:112 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/security/src/oauth/refresh.ts:117 |
| <a id="property-token"></a> `token` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | packages/security/src/oauth/refresh.ts:115 |
| <a id="property-tokentypehint"></a> `tokenTypeHint?` | `readonly` | `"access_token"` \| `"refresh_token"` | packages/security/src/oauth/refresh.ts:116 |
