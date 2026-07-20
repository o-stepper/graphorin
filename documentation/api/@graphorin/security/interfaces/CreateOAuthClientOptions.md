[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / CreateOAuthClientOptions

# Interface: CreateOAuthClientOptions

Defined in: packages/security/src/oauth/types.ts:76

**`Stable`**

Configuration options for `createOAuthClient(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `fields?`) => `void` | Optional logger. | packages/security/src/oauth/types.ts:105 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) | Optional pre-discovered metadata (skip the network round-trip). | packages/security/src/oauth/types.ts:103 |
| <a id="property-refreshaheadms"></a> `refreshAheadMs?` | `readonly` | `number` | Refresh-ahead window in ms. On the client itself this only colours `status()` labels (`'expiring-soon'`); the proactive refresh that uses the window lives in the MCP bridge's authorization provider (`createOAuthAuthorizationProvider`), which refreshes when the persisted expiry is within its own `refreshAheadMs`. | packages/security/src/oauth/types.ts:101 |
| <a id="property-registration"></a> `registration?` | `readonly` | [`OAuthRegistration`](/api/@graphorin/security/interfaces/OAuthRegistration.md) | Stored / persistent registration metadata. | packages/security/src/oauth/types.ts:82 |
| <a id="property-secretsstore"></a> `secretsStore?` | `readonly` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) | Secrets store the actual tokens are persisted into. When supplied, `persistSession` writes the access / refresh / id tokens under the `oauth:<serverId>:<kind>` keys the record's refs point at, and refresh / revoke / status resolve them back - so sessions survive process restarts. Without it, tokens live only in process memory (the documented legacy behavior). | packages/security/src/oauth/types.ts:93 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | Stable identifier; persisted into the `OAuthServerStore`. | packages/security/src/oauth/types.ts:78 |
| <a id="property-serverurl"></a> `serverUrl` | `readonly` | `string` | Base URL of the OAuth-protected resource server. | packages/security/src/oauth/types.ts:80 |
| <a id="property-storage"></a> `storage` | `readonly` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | Persistent storage for the registration + token-ref metadata. | packages/security/src/oauth/types.ts:84 |
