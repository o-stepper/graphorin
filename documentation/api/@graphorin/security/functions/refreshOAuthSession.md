[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / refreshOAuthSession

# Function: refreshOAuthSession()

```ts
function refreshOAuthSession(
   storage, 
   serverId, 
options?): Promise<OAuthSession>;
```

Defined in: [packages/security/src/oauth/library.ts:152](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L152)

Refresh the OAuth session for `serverId`. Throws when the session
has no refresh token or when the authorization server rejects the
refresh.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | - |
| `serverId` | `string` | - |
| `options` | \{ `secretsStore?`: [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md); `signal?`: `AbortSignal`; \} | - |
| `options.secretsStore?` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) | SPL-1: resolves the persisted refresh token across processes. |
| `options.signal?` | `AbortSignal` | - |

## Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;

## Stable
