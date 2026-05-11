[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / fetchAuthorizationServerMetadata

# Function: fetchAuthorizationServerMetadata()

```ts
function fetchAuthorizationServerMetadata(serverUrl, signal?): Promise<OAuthServerMetadata>;
```

Defined in: packages/security/src/oauth/discovery.ts:89

Fetch authorization-server metadata (RFC 8414). Tries
`/.well-known/oauth-authorization-server` first, then
`/.well-known/openid-configuration` as the OpenID-Connect fallback.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `serverUrl` | `string` |
| `signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;[`OAuthServerMetadata`](/api/@graphorin/security/interfaces/OAuthServerMetadata.md)\&gt;

## Stable
