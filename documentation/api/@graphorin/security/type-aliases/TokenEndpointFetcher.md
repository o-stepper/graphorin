[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenEndpointFetcher

# Type Alias: TokenEndpointFetcher

```ts
type TokenEndpointFetcher = (url, init) => Promise<TokenEndpointResponse>;
```

Defined in: packages/security/src/oauth/token-endpoint.ts:15

Strategy hook used by tests to inject synthetic token responses.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `init` | \{ `basicAuth?`: `string`; `body`: `string`; `signal?`: `AbortSignal`; \} |
| `init.basicAuth?` | `string` |
| `init.body` | `string` |
| `init.signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;[`TokenEndpointResponse`](/api/@graphorin/security/interfaces/TokenEndpointResponse.md)\&gt;
