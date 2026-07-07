[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setTokenEndpointFetcherForTesting

# Function: \_setTokenEndpointFetcherForTesting()

```ts
function _setTokenEndpointFetcherForTesting(fetcher): void;
```

Defined in: [packages/security/src/oauth/token-endpoint.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/token-endpoint.ts#L56)

**`Experimental`**

Override the token-endpoint fetcher. Used by the test suite to
inject canned responses without hitting the network.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fetcher` | \| [`TokenEndpointFetcher`](/api/@graphorin/security/type-aliases/TokenEndpointFetcher.md) \| `null` |

## Returns

`void`
