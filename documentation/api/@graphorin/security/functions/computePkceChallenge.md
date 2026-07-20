[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / computePkceChallenge

# Function: computePkceChallenge()

```ts
function computePkceChallenge(verifier): string;
```

Defined in: packages/security/src/oauth/pkce.ts:46

**`Stable`**

Compute the SHA-256 challenge for a verifier (S256 method).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `verifier` | `string` |

## Returns

`string`
