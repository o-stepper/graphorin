[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / rotateToken

# Function: rotateToken()

```ts
function rotateToken(options): Promise<{
  next: CreatedToken;
  old: TokenMetadata;
}>;
```

Defined in: packages/security/src/auth/crud.ts:169

**`Stable`**

Revoke a token and immediately mint a fresh one with the same
scopes. Useful for grace-period rotations.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `Omit`\&lt;[`CreateTokenOptions`](/api/@graphorin/security/interfaces/CreateTokenOptions.md), `"env"` \| `"scopes"` \| `"idOverride"`\&gt; & \{ `env?`: `string`; `id`: `string`; `scopesOverride?`: readonly `string`[]; `verifier?`: \{ `invalidate`: `void`; \}; \} |

## Returns

`Promise`\<\{
  `next`: [`CreatedToken`](/api/@graphorin/security/interfaces/CreatedToken.md);
  `old`: [`TokenMetadata`](/api/@graphorin/security/interfaces/TokenMetadata.md);
\}\>
