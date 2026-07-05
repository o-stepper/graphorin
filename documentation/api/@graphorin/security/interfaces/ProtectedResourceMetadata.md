[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ProtectedResourceMetadata

# Interface: ProtectedResourceMetadata

Defined in: packages/security/src/oauth/types.ts:51

Discovered protected-resource metadata (RFC 9728). Returned by the
`${resourceUrl}/.well-known/oauth-protected-resource` endpoint.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-authorizationservers"></a> `authorizationServers` | `readonly` | readonly `string`[] | packages/security/src/oauth/types.ts:53 |
| <a id="property-bearermethodssupported"></a> `bearerMethodsSupported?` | `readonly` | readonly `string`[] | packages/security/src/oauth/types.ts:54 |
| <a id="property-raw"></a> `raw?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/security/src/oauth/types.ts:56 |
| <a id="property-resource"></a> `resource` | `readonly` | `string` | packages/security/src/oauth/types.ts:52 |
| <a id="property-resourcedocumentation"></a> `resourceDocumentation?` | `readonly` | `string` | packages/security/src/oauth/types.ts:55 |
