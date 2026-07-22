[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / createManagedMCPClient

# Function: createManagedMCPClient()

```ts
function createManagedMCPClient(options): Promise<MCPClient>;
```

Defined in: packages/mcp/src/client/managed.ts:66

**`Stable`**

Open a managed (auto-reconnecting) MCP client. See the module doc for
the exact semantics. `close()` is terminal: it stops any in-progress
backoff and no further reconnects happen.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateManagedMCPClientOptions`](/api/@graphorin/mcp/type-aliases/CreateManagedMCPClientOptions.md) |

## Returns

`Promise`\&lt;[`MCPClient`](/api/@graphorin/mcp/interfaces/MCPClient.md)\&gt;
