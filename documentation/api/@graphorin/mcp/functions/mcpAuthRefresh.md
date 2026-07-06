[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / mcpAuthRefresh

# Function: mcpAuthRefresh()

```ts
function mcpAuthRefresh(
   storage, 
   serverId, 
options?): Promise<OAuthSession>;
```

Defined in: packages/mcp/src/oauth/library.ts:41

Drive `graphorin auth refresh --mcp <id>`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |
| `serverId` | `string` |
| `options` | \{ `signal?`: `AbortSignal`; \} |
| `options.signal?` | `AbortSignal` |

## Returns

`Promise`\<[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\>
