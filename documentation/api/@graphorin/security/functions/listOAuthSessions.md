[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / listOAuthSessions

# Function: listOAuthSessions()

```ts
function listOAuthSessions(storage, options?): Promise<readonly OAuthSessionMetadata[]>;
```

Defined in: [packages/security/src/oauth/library.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L105)

List the audit-safe metadata of every persisted OAuth session.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |
| `options` | \{ `secretsStore?`: [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md); \} |
| `options.secretsStore?` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) |

## Returns

`Promise`\&lt;readonly [`OAuthSessionMetadata`](/api/@graphorin/security/interfaces/OAuthSessionMetadata.md)[]\&gt;

## Stable
