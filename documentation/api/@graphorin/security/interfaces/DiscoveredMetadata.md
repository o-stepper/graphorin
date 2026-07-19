[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DiscoveredMetadata

# Interface: DiscoveredMetadata

Defined in: packages/security/src/oauth/types.ts:66

**`Stable`**

Result of running the discovery pipeline. Either the protected
resource metadata produced an authorization-server URL we then
fetched, or we discovered the authorization-server directly.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-resource"></a> `resource?` | `readonly` | [`ProtectedResourceMetadata`](/api/@graphorin/security/interfaces/ProtectedResourceMetadata.md) | packages/security/src/oauth/types.ts:68 |
| <a id="property-server"></a> `server` | `readonly` | [`OAuthServerMetadata`](/api/@graphorin/security/interfaces/OAuthServerMetadata.md) | packages/security/src/oauth/types.ts:67 |
