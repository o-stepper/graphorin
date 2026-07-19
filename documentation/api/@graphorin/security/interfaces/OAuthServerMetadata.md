[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthServerMetadata

# Interface: OAuthServerMetadata

Defined in: packages/security/src/oauth/types.ts:28

**`Stable`**

Discovered authorization-server metadata. A subset of RFC 8414 +
the OpenID Connect discovery surface. Fields the framework does
not use are intentionally elided.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-authorizationendpoint"></a> `authorizationEndpoint` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:30 |
| <a id="property-codechallengemethodssupported"></a> `codeChallengeMethodsSupported?` | `readonly` | readonly `string`[] | - | packages/security/src/oauth/types.ts:40 |
| <a id="property-deviceauthorizationendpoint"></a> `deviceAuthorizationEndpoint?` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:34 |
| <a id="property-granttypessupported"></a> `grantTypesSupported?` | `readonly` | readonly `string`[] | - | packages/security/src/oauth/types.ts:39 |
| <a id="property-issuer"></a> `issuer` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:29 |
| <a id="property-jwksuri"></a> `jwksUri?` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:36 |
| <a id="property-raw"></a> `raw?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | Original discovery payload, captured for diagnostics. | packages/security/src/oauth/types.ts:42 |
| <a id="property-registrationendpoint"></a> `registrationEndpoint?` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:32 |
| <a id="property-responsetypessupported"></a> `responseTypesSupported?` | `readonly` | readonly `string`[] | - | packages/security/src/oauth/types.ts:38 |
| <a id="property-revocationendpoint"></a> `revocationEndpoint?` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:33 |
| <a id="property-scopessupported"></a> `scopesSupported?` | `readonly` | readonly `string`[] | - | packages/security/src/oauth/types.ts:37 |
| <a id="property-tokenendpoint"></a> `tokenEndpoint` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:31 |
| <a id="property-userinfoendpoint"></a> `userinfoEndpoint?` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:35 |
