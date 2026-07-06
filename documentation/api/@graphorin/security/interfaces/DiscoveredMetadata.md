[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DiscoveredMetadata

# Interface: DiscoveredMetadata

Defined in: [packages/security/src/oauth/types.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L66)

Result of running the discovery pipeline. Either the protected
resource metadata produced an authorization-server URL we then
fetched, or we discovered the authorization-server directly.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-resource"></a> `resource?` | `readonly` | [`ProtectedResourceMetadata`](/api/@graphorin/security/interfaces/ProtectedResourceMetadata.md) | [packages/security/src/oauth/types.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L68) |
| <a id="property-server"></a> `server` | `readonly` | [`OAuthServerMetadata`](/api/@graphorin/security/interfaces/OAuthServerMetadata.md) | [packages/security/src/oauth/types.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L67) |
