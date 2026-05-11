[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RefreshAccessTokenArgs

# Interface: RefreshAccessTokenArgs

Defined in: packages/security/src/oauth/refresh.ts:20

Internal arguments for the refresh helper.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-metadata"></a> `metadata` | `readonly` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) | packages/security/src/oauth/refresh.ts:22 |
| <a id="property-refreshtoken"></a> `refreshToken` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | packages/security/src/oauth/refresh.ts:24 |
| <a id="property-registration"></a> `registration` | `readonly` | [`OAuthRegistration`](/api/@graphorin/security/interfaces/OAuthRegistration.md) | packages/security/src/oauth/refresh.ts:23 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | packages/security/src/oauth/refresh.ts:25 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | packages/security/src/oauth/refresh.ts:21 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/security/src/oauth/refresh.ts:26 |
