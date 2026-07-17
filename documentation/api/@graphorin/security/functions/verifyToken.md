[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / verifyToken

# Function: verifyToken()

```ts
function verifyToken(
   rawToken, 
   options, 
ctx?): Promise<VerifyResult>;
```

Defined in: [packages/security/src/auth/verify.ts:438](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/verify.ts#L438)

Functional convenience wrapper around `TokenVerifier#verify`. The
stateless variant constructs a one-shot verifier per call and is
**only** suitable for tests; production code holds a long-lived
`TokenVerifier` so the warm cache earns its keep.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `rawToken` | `string` |
| `options` | [`VerifierOptions`](/api/@graphorin/security/interfaces/VerifierOptions.md) |
| `ctx?` | [`VerifyContext`](/api/@graphorin/security/interfaces/VerifyContext.md) |

## Returns

`Promise`\&lt;[`VerifyResult`](/api/@graphorin/security/type-aliases/VerifyResult.md)\&gt;

## Stable
