[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setDiscoveryFetcherForTesting

# Function: \_setDiscoveryFetcherForTesting()

```ts
function _setDiscoveryFetcherForTesting(fetcher): void;
```

Defined in: packages/security/src/oauth/discovery.ts:35

**`Experimental`**

Override the discovery fetcher. Used by the test suite to inject
synthetic metadata documents.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fetcher` | \| [`DiscoveryFetcher`](/api/@graphorin/security/type-aliases/DiscoveryFetcher.md) \| `null` |

## Returns

`void`
