[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / mcpAuthStatus

# Function: mcpAuthStatus()

```ts
function mcpAuthStatus(storage, options?): Promise<OAuthStatusSnapshot>;
```

Defined in: [packages/mcp/src/oauth/library.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/library.ts#L69)

Drive `graphorin auth status --mcp`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |
| `options` | \{ `secretsStore?`: [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md); \} |
| `options.secretsStore?` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) |

## Returns

`Promise`\&lt;[`OAuthStatusSnapshot`](/api/@graphorin/security/interfaces/OAuthStatusSnapshot.md)\&gt;
