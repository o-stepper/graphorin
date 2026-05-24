[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / discoverMetadata

# Function: discoverMetadata()

```ts
function discoverMetadata(serverUrl, signal?): Promise<DiscoveredMetadata>;
```

Defined in: packages/security/src/oauth/discovery.ts:62

Resolve full discovery metadata for `serverUrl`. The pipeline
tries the protected-resource metadata first (RFC 9728), then falls
back to the authorization-server metadata directly (RFC 8414 +
OpenID Connect Discovery).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `serverUrl` | `string` |
| `signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;[`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md)\&gt;

## Stable
