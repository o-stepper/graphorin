[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / refreshAccessToken

# Function: refreshAccessToken()

```ts
function refreshAccessToken(args): Promise<OAuthSession>;
```

Defined in: packages/security/src/oauth/refresh.ts:52

**`Stable`**

Refresh the access token. Identical concurrent invocations share a
single in-flight request; subsequent callers observe the same
resolved session.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`RefreshAccessTokenArgs`](/api/@graphorin/security/interfaces/RefreshAccessTokenArgs.md) |

## Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;
