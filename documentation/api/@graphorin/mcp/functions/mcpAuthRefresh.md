[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / mcpAuthRefresh

# Function: mcpAuthRefresh()

```ts
function mcpAuthRefresh(
   storage, 
   serverId, 
options?): Promise<OAuthSession>;
```

Defined in: [packages/mcp/src/oauth/library.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/oauth/library.ts#L41)

Drive `graphorin auth refresh --mcp <id>`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md) |
| `serverId` | `string` |
| `options` | \{ `signal?`: `AbortSignal`; \} |
| `options.signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;
