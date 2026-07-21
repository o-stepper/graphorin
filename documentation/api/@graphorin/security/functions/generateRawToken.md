[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / generateRawToken

# Function: generateRawToken()

```ts
function generateRawToken(opts): {
  entropyBytes: Buffer;
  raw: string;
};
```

Defined in: packages/security/src/auth/token-format.ts:254

**`Stable`**

Generate a brand-new raw token. The result is the only place the
plaintext value exists; callers MUST hand it to the user immediately
and persist only the HMAC hash via the `AuthTokenStore` contract.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`GenerateRawTokenOptions`](/api/@graphorin/security/interfaces/GenerateRawTokenOptions.md) |

## Returns

```ts
{
  entropyBytes: Buffer;
  raw: string;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `entropyBytes` | `Buffer` | packages/security/src/auth/token-format.ts:256 |
| `raw` | `string` | packages/security/src/auth/token-format.ts:255 |
