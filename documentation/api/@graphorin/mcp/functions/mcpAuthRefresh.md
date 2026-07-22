[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / mcpAuthRefresh

# Function: mcpAuthRefresh()

```ts
function mcpAuthRefresh(
   storage, 
   serverId, 
options?): Promise<OAuthSession>;
```

Defined in: packages/mcp/src/oauth/library.ts:42

Drive `graphorin auth refresh --mcp <id>`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) | - |
| `serverId` | `string` | - |
| `options` | \{ `secretsStore?`: [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md); `signal?`: `AbortSignal`; \} | - |
| `options.secretsStore?` | [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md) | Resolves the persisted refresh token across processes. |
| `options.signal?` | `AbortSignal` | - |

## Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;
