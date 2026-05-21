[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / revokeToken

# Function: revokeToken()

```ts
function revokeToken(
   tokenStore, 
   id, 
   opts?): Promise<
  | TokenMetadata
| undefined>;
```

Defined in: packages/security/src/auth/crud.ts:126

Soft-revoke a token. Returns the updated record or `undefined` if
the token is unknown. The store is responsible for setting the
`revokedAt` column atomically.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tokenStore` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) |
| `id` | `string` |
| `opts` | \{ `now?`: () => `number`; \} |
| `opts.now?` | () => `number` |

## Returns

`Promise`\<
  \| [`TokenMetadata`](/api/@graphorin/security/interfaces/TokenMetadata.md)
  \| `undefined`\>

## Stable
