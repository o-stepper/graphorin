[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / createToken

# Function: createToken()

```ts
function createToken(options): Promise<CreatedToken>;
```

Defined in: packages/security/src/auth/crud.ts:65

**`Stable`**

Mint a new token, persist its HMAC hash through the injected store,
and return the raw token wrapped in a `SecretValue`. The plaintext
value is shown to the user exactly once - at the call site of this
function.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateTokenOptions`](/api/@graphorin/security/interfaces/CreateTokenOptions.md) |

## Returns

`Promise`\&lt;[`CreatedToken`](/api/@graphorin/security/interfaces/CreatedToken.md)\&gt;
