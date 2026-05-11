[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / mcpAuthRevoke

# Function: mcpAuthRevoke()

```ts
function mcpAuthRevoke(
   storage, 
   serverId, 
options?): Promise<void>;
```

Defined in: packages/mcp/src/oauth/library.ts:50

Drive `graphorin auth revoke --mcp <id>`.

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
