[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RevokeOAuthTokenArgs

# Interface: RevokeOAuthTokenArgs

Defined in: [packages/security/src/oauth/refresh.ts:149](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L149)

Internal arguments for the revoke helper.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-metadata"></a> `metadata` | `readonly` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) | [packages/security/src/oauth/refresh.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L151) |
| <a id="property-registration"></a> `registration` | `readonly` | [`OAuthRegistration`](/api/@graphorin/security/interfaces/OAuthRegistration.md) | [packages/security/src/oauth/refresh.ts:152](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L152) |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | [packages/security/src/oauth/refresh.ts:150](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L150) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | [packages/security/src/oauth/refresh.ts:155](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L155) |
| <a id="property-token"></a> `token` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | [packages/security/src/oauth/refresh.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L153) |
| <a id="property-tokentypehint"></a> `tokenTypeHint?` | `readonly` | `"access_token"` \| `"refresh_token"` | [packages/security/src/oauth/refresh.ts:154](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L154) |
