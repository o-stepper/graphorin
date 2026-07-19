[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / postToTokenEndpoint

# Function: postToTokenEndpoint()

```ts
function postToTokenEndpoint(
   endpoint, 
   params, 
options?): Promise<TokenEndpointResponse>;
```

Defined in: packages/security/src/oauth/token-endpoint.ts:68

**`Stable`**

POST `params` to the token endpoint and return the parsed JSON
body. The helper does not throw on non-2xx responses - the caller
is responsible for branching on `.ok` so error responses can
surface the spec-defined `error` / `error_description` fields.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `endpoint` | `string` |
| `params` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> |
| `options` | \{ `basicAuth?`: `string`; `signal?`: `AbortSignal`; \} |
| `options.basicAuth?` | `string` |
| `options.signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;[`TokenEndpointResponse`](/api/@graphorin/security/interfaces/TokenEndpointResponse.md)\&gt;
