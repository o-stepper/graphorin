[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / listTokens

# Function: listTokens()

```ts
function listTokens(tokenStore, opts?): Promise<readonly TokenMetadata[]>;
```

Defined in: packages/security/src/auth/crud.ts:120

**`Stable`**

List token metadata. Never returns the raw token or the HMAC hash;
the hash is hex on-disk only and would otherwise be a small offline
brute-force vector if both the database **and** the pepper were
compromised.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tokenStore` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) |
| `opts` | \{ `includeRevoked?`: `boolean`; \} |
| `opts.includeRevoked?` | `boolean` |

## Returns

`Promise`\&lt;readonly [`TokenMetadata`](/api/@graphorin/security/interfaces/TokenMetadata.md)[]\&gt;
