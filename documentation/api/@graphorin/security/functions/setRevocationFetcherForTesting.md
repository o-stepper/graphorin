[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setRevocationFetcherForTesting

# Function: \_setRevocationFetcherForTesting()

```ts
function _setRevocationFetcherForTesting(fetcher): void;
```

Defined in: [packages/security/src/oauth/refresh.ts:144](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/refresh.ts#L144)

**`Experimental`**

Override the revocation fetcher. Used by the test suite.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fetcher` | \| [`RevocationFetcher`](/api/@graphorin/security/type-aliases/RevocationFetcher.md) \| `null` |

## Returns

`void`
