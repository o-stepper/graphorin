[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setRevocationFetcherForTesting

# Function: \_setRevocationFetcherForTesting()

```ts
function _setRevocationFetcherForTesting(fetcher): void;
```

Defined in: packages/security/src/oauth/refresh.ts:144

**`Experimental`**

Override the revocation fetcher. Used by the test suite.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fetcher` | \| [`RevocationFetcher`](/api/@graphorin/security/type-aliases/RevocationFetcher.md) \| `null` |

## Returns

`void`
