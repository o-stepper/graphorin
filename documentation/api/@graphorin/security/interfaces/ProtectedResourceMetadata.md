[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ProtectedResourceMetadata

# Interface: ProtectedResourceMetadata

Defined in: [packages/security/src/oauth/types.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L51)

Discovered protected-resource metadata (RFC 9728). Returned by the
`${resourceUrl}/.well-known/oauth-protected-resource` endpoint.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-authorizationservers"></a> `authorizationServers` | `readonly` | readonly `string`[] | [packages/security/src/oauth/types.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L53) |
| <a id="property-bearermethodssupported"></a> `bearerMethodsSupported?` | `readonly` | readonly `string`[] | [packages/security/src/oauth/types.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L54) |
| <a id="property-raw"></a> `raw?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/security/src/oauth/types.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L56) |
| <a id="property-resource"></a> `resource` | `readonly` | `string` | [packages/security/src/oauth/types.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L52) |
| <a id="property-resourcedocumentation"></a> `resourceDocumentation?` | `readonly` | `string` | [packages/security/src/oauth/types.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L55) |
