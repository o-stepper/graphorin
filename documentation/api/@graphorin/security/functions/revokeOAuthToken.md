[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / revokeOAuthToken

# Function: revokeOAuthToken()

```ts
function revokeOAuthToken(args): Promise<void>;
```

Defined in: packages/security/src/oauth/refresh.ts:167

Revoke an OAuth token via RFC 7009. Honest failure semantics
(SPL-1 / SPL-16): a missing revocation endpoint, a network failure,
and a non-2xx response all **throw** - the caller decides whether
teardown proceeds, and the audit trail never claims a server-side
revocation that was not confirmed.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`RevokeOAuthTokenArgs`](/api/@graphorin/security/interfaces/RevokeOAuthTokenArgs.md) |

## Returns

`Promise`\<`void`\>

## Stable
