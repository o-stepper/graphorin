[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / revokeOAuthToken

# Function: revokeOAuthToken()

```ts
function revokeOAuthToken(args): Promise<void>;
```

Defined in: packages/security/src/oauth/refresh.ts:159

Revoke an OAuth token via RFC 7009. The metadata must advertise the
revocation endpoint; otherwise the helper resolves silently — the
audit log records the revocation regardless.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`RevokeOAuthTokenArgs`](/api/@graphorin/security/interfaces/RevokeOAuthTokenArgs.md) |

## Returns

`Promise`\&lt;`void`\&gt;

## Stable
