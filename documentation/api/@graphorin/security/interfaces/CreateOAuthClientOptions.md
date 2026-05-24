[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / CreateOAuthClientOptions

# Interface: CreateOAuthClientOptions

Defined in: packages/security/src/oauth/types.ts:76

Configuration options for `createOAuthClient(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `fields?`) => `void` | Optional logger. | packages/security/src/oauth/types.ts:90 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) | Optional pre-discovered metadata (skip the network round-trip). | packages/security/src/oauth/types.ts:88 |
| <a id="property-refreshaheadms"></a> `refreshAheadMs?` | `readonly` | `number` | Refresh-ahead window (ms before `expiresAt` triggers a refresh). | packages/security/src/oauth/types.ts:86 |
| <a id="property-registration"></a> `registration?` | `readonly` | [`OAuthRegistration`](/api/@graphorin/security/interfaces/OAuthRegistration.md) | Stored / persistent registration metadata. | packages/security/src/oauth/types.ts:82 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | Stable identifier; persisted into the OAuthServerStore. | packages/security/src/oauth/types.ts:78 |
| <a id="property-serverurl"></a> `serverUrl` | `readonly` | `string` | Base URL of the OAuth-protected resource server. | packages/security/src/oauth/types.ts:80 |
| <a id="property-storage"></a> `storage` | `readonly` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | Persistent storage for the registration + token-ref metadata. | packages/security/src/oauth/types.ts:84 |
