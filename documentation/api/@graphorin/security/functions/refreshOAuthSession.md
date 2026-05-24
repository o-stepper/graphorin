[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / refreshOAuthSession

# Function: refreshOAuthSession()

```ts
function refreshOAuthSession(
   storage, 
   serverId, 
options?): Promise<OAuthSession>;
```

Defined in: packages/security/src/oauth/library.ts:140

Refresh the OAuth session for `serverId`. Throws when the session
has no refresh token or when the authorization server rejects the
refresh.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |
| `serverId` | `string` |
| `options` | \{ `signal?`: `AbortSignal`; \} |
| `options.signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;

## Stable
