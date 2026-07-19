[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / revokeOAuthSession

# Function: revokeOAuthSession()

```ts
function revokeOAuthSession(
   storage, 
   serverId, 
options?): Promise<void>;
```

Defined in: packages/security/src/oauth/library.ts:182

**`Stable`**

Revoke the OAuth session for `serverId`. The function always tears
the persisted record down even when the revocation endpoint
returns an error.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | - |
| `serverId` | `string` | - |
| `options` | \{ `reason?`: `string`; `secretsStore?`: [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md); `signal?`: `AbortSignal`; \} | - |
| `options.reason?` | `string` | - |
| `options.secretsStore?` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) | Resolves the persisted tokens so RFC 7009 actually fires. |
| `options.signal?` | `AbortSignal` | - |

## Returns

`Promise`\&lt;`void`\&gt;
