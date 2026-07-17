[**Graphorin API reference v0.12.0**](../../../index.md)

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

Defined in: [packages/security/src/auth/crud.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L137)

Soft-revoke a token. Returns the updated record or `undefined` if
the token is unknown. The store is responsible for setting the
`revokedAt` column atomically.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokenStore` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) | - |
| `id` | `string` | - |
| `opts` | \{ `now?`: () => `number`; `verifier?`: \{ `invalidate`: `void`; \}; \} | - |
| `opts.now?` | () => `number` | - |
| `opts.verifier?` | \{ `invalidate`: `void`; \} | SPL-9: pass the live `TokenVerifier` so revocation invalidates its LRU entry immediately - without it a revoked token keeps verifying from the cache for up to `cacheTtlMaxMs` (default 60s). |
| `opts.verifier.invalidate` | - |

## Returns

`Promise`\<
  \| [`TokenMetadata`](/api/@graphorin/security/interfaces/TokenMetadata.md)
  \| `undefined`\>

## Stable
