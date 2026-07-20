[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PublicKeyFetcher

# Type Alias: PublicKeyFetcher

```ts
type PublicKeyFetcher = (url, signal?) => Promise<string>;
```

Defined in: packages/security/src/supply-chain/signature.ts:32

**`Experimental`**

Strategy hook used by tests so the unit suite never fetches a real
`well-known` URL.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;`string`\&gt;
