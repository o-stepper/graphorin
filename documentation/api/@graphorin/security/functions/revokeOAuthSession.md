[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / revokeOAuthSession

# Function: revokeOAuthSession()

```ts
function revokeOAuthSession(
   storage, 
   serverId, 
options?): Promise<void>;
```

Defined in: packages/security/src/oauth/library.ts:165

Revoke the OAuth session for `serverId`. The function always tears
the persisted record down even when the revocation endpoint
returns an error.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |
| `serverId` | `string` |
| `options` | \{ `reason?`: `string`; `signal?`: `AbortSignal`; \} |
| `options.reason?` | `string` |
| `options.signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;`void`\&gt;

## Stable
