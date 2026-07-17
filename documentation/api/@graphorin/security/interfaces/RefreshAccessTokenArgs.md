[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RefreshAccessTokenArgs

# Interface: RefreshAccessTokenArgs

Defined in: [packages/security/src/oauth/refresh.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L20)

Internal arguments for the refresh helper.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-force"></a> `force?` | `readonly` | `boolean` | Bypass the in-flight dedupe (SPL-12): a forced refresh always issues a fresh token-endpoint request instead of joining the shared in-flight promise. | [packages/security/src/oauth/refresh.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L42) |
| <a id="property-metadata"></a> `metadata` | `readonly` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) | - | [packages/security/src/oauth/refresh.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L22) |
| <a id="property-refreshtoken"></a> `refreshToken` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | - | [packages/security/src/oauth/refresh.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L24) |
| <a id="property-registration"></a> `registration` | `readonly` | [`OAuthRegistration`](/api/@graphorin/security/interfaces/OAuthRegistration.md) | - | [packages/security/src/oauth/refresh.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L23) |
| <a id="property-revokepreviousonrotation"></a> `revokePreviousOnRotation?` | `readonly` | `boolean` | When `true` and the authorization server **rotates** the refresh token (RFC 6749 §10.4 / OAuth 2.1 - the token response carries a *different* `refresh_token`), best-effort revoke the previous refresh token via [revokeOAuthToken](/api/@graphorin/security/functions/revokeOAuthToken.md). Defaults to `false` so existing callers are unaffected; servers that already invalidate the old token on rotation make this a defense-in-depth no-op. Revocation failures never fail the refresh. | [packages/security/src/oauth/refresh.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L36) |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | - | [packages/security/src/oauth/refresh.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L25) |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | - | [packages/security/src/oauth/refresh.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L21) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/security/src/oauth/refresh.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L26) |
