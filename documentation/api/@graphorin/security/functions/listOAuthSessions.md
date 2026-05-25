[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / listOAuthSessions

# Function: listOAuthSessions()

```ts
function listOAuthSessions(storage): Promise<readonly OAuthSessionMetadata[]>;
```

Defined in: packages/security/src/oauth/library.ts:99

List the audit-safe metadata of every persisted OAuth session.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |

## Returns

`Promise`\&lt;readonly [`OAuthSessionMetadata`](/api/@graphorin/security/interfaces/OAuthSessionMetadata.md)[]\&gt;

## Stable
