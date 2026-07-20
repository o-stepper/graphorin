[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getOAuthStatus

# Function: getOAuthStatus()

```ts
function getOAuthStatus(storage, options?): Promise<OAuthStatusSnapshot>;
```

Defined in: packages/security/src/oauth/library.ts:248

**`Stable`**

Build the snapshot returned by `graphorin auth status` (Phase 15).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |
| `options` | \{ `secretsStore?`: [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md); \} |
| `options.secretsStore?` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) |

## Returns

`Promise`\&lt;[`OAuthStatusSnapshot`](/api/@graphorin/security/interfaces/OAuthStatusSnapshot.md)\&gt;
