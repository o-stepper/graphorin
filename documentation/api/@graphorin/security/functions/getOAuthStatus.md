[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getOAuthStatus

# Function: getOAuthStatus()

```ts
function getOAuthStatus(storage): Promise<OAuthStatusSnapshot>;
```

Defined in: packages/security/src/oauth/library.ts:222

Build the snapshot returned by `graphorin auth status` (Phase 15).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |

## Returns

`Promise`\&lt;[`OAuthStatusSnapshot`](/api/@graphorin/security/interfaces/OAuthStatusSnapshot.md)\&gt;

## Stable
