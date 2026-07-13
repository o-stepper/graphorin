[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setPublicKeyFetcherForTesting

# Function: \_setPublicKeyFetcherForTesting()

```ts
function _setPublicKeyFetcherForTesting(fetcher): void;
```

Defined in: [packages/security/src/supply-chain/signature.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/signature.ts#L41)

**`Experimental`**

Override the public-key fetcher. Used by the test suite.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fetcher` | \| [`PublicKeyFetcher`](/api/@graphorin/security/type-aliases/PublicKeyFetcher.md) \| `null` |

## Returns

`void`
