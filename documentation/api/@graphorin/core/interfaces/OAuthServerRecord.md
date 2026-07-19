[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / OAuthServerRecord

# Interface: OAuthServerRecord

Defined in: packages/core/src/contracts/oauth-server-store.ts:12

**`Stable`**

Persisted metadata for an OAuth server registration. The framework
never stores raw token material here - the access, refresh, id, and
client-secret tokens live in the [SecretsStore](/api/@graphorin/core/interfaces/SecretsStore.md) and this
record only holds the [SecretRef](/api/@graphorin/core/interfaces/SecretRef.md) URIs that resolve them.

Schema mirrors the canonical `oauth_servers` SQLite table provided
by `@graphorin/store-sqlite`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-accesstokenref"></a> `accessTokenRef?` | `readonly` | `string` | [SecretRef](/api/@graphorin/core/interfaces/SecretRef.md) URI for the access token. | packages/core/src/contracts/oauth-server-store.ts:34 |
| <a id="property-authorizationendpoint"></a> `authorizationEndpoint?` | `readonly` | `string` | Authorization-server `authorization_endpoint`. | packages/core/src/contracts/oauth-server-store.ts:18 |
| <a id="property-clientid"></a> `clientId` | `readonly` | `string` | Public client identifier; safe to log. | packages/core/src/contracts/oauth-server-store.ts:30 |
| <a id="property-clientsecretref"></a> `clientSecretRef?` | `readonly` | `string` | [SecretRef](/api/@graphorin/core/interfaces/SecretRef.md) URI for the confidential-client secret. | packages/core/src/contracts/oauth-server-store.ts:32 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `number` | Epoch milliseconds when the record was first created. | packages/core/src/contracts/oauth-server-store.ts:52 |
| <a id="property-deviceauthorizationendpoint"></a> `deviceAuthorizationEndpoint?` | `readonly` | `string` | Authorization-server `device_authorization_endpoint` (RFC 8628). | packages/core/src/contracts/oauth-server-store.ts:26 |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `number` | Epoch milliseconds when the access token stops being valid. | packages/core/src/contracts/oauth-server-store.ts:40 |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable, human-readable identifier (e.g. `'linear-mcp'`). | packages/core/src/contracts/oauth-server-store.ts:14 |
| <a id="property-idtokenref"></a> `idTokenRef?` | `readonly` | `string` | [SecretRef](/api/@graphorin/core/interfaces/SecretRef.md) URI for the OIDC ID token. | packages/core/src/contracts/oauth-server-store.ts:38 |
| <a id="property-issuer"></a> `issuer?` | `readonly` | `string` | Issuer identifier reported in the discovery response. | packages/core/src/contracts/oauth-server-store.ts:28 |
| <a id="property-lastrefreshedat"></a> `lastRefreshedAt?` | `readonly` | `number` | Epoch milliseconds of the last successful refresh. | packages/core/src/contracts/oauth-server-store.ts:48 |
| <a id="property-lastrefresherror"></a> `lastRefreshError?` | `readonly` | `string` | Last error string captured from a failing refresh attempt. | packages/core/src/contracts/oauth-server-store.ts:50 |
| <a id="property-redirecturi"></a> `redirectUri?` | `readonly` | `string` | Redirect URI that was used during the most recent code flow. | packages/core/src/contracts/oauth-server-store.ts:44 |
| <a id="property-refreshtokenref"></a> `refreshTokenRef?` | `readonly` | `string` | [SecretRef](/api/@graphorin/core/interfaces/SecretRef.md) URI for the refresh token. | packages/core/src/contracts/oauth-server-store.ts:36 |
| <a id="property-registeredvia"></a> `registeredVia?` | `readonly` | `"dcr"` \| `"manual"` | Whether the client was registered via Dynamic Client Registration. | packages/core/src/contracts/oauth-server-store.ts:46 |
| <a id="property-registrationendpoint"></a> `registrationEndpoint?` | `readonly` | `string` | Authorization-server `registration_endpoint` (RFC 7591). | packages/core/src/contracts/oauth-server-store.ts:22 |
| <a id="property-revocationendpoint"></a> `revocationEndpoint?` | `readonly` | `string` | Authorization-server `revocation_endpoint` (RFC 7009). | packages/core/src/contracts/oauth-server-store.ts:24 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | Granted scopes (space-separated string per the OAuth spec). | packages/core/src/contracts/oauth-server-store.ts:42 |
| <a id="property-serverurl"></a> `serverUrl` | `readonly` | `string` | Base URL of the OAuth-protected resource server (e.g. MCP endpoint). | packages/core/src/contracts/oauth-server-store.ts:16 |
| <a id="property-tokenendpoint"></a> `tokenEndpoint?` | `readonly` | `string` | Authorization-server `token_endpoint`. | packages/core/src/contracts/oauth-server-store.ts:20 |
| <a id="property-updatedat"></a> `updatedAt` | `readonly` | `number` | Epoch milliseconds when the record was last updated. | packages/core/src/contracts/oauth-server-store.ts:54 |
