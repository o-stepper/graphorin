[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / rekeyTokens

# Function: rekeyTokens()

```ts
function rekeyTokens(options): Promise<ReadonlyMap<string, CreatedToken>>;
```

Defined in: packages/security/src/auth/crud.ts:221

**`Stable`**

Re-issue every active token. Used after a known compromise: the
previous tokens are revoked and replaced with fresh raw values
using the same scopes / labels.

Returns the new tokens keyed by their old id so the caller can
route the rotated raws back to the right user.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `env`: `string`; `now?`: () => `number`; `pepper`: [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md); `prefix?`: `string`; `tokenStore`: [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md); \} |
| `options.env` | `string` |
| `options.now?` | () => `number` |
| `options.pepper` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) |
| `options.prefix?` | `string` |
| `options.tokenStore` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) |

## Returns

`Promise`\<`ReadonlyMap`\&lt;`string`, [`CreatedToken`](/api/@graphorin/security/interfaces/CreatedToken.md)\&gt;\>
