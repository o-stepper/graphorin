[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / adaptMCPTools

# Function: adaptMCPTools()

```ts
function adaptMCPTools(args): AdaptedToolsResult;
```

Defined in: [packages/mcp/src/client/to-tools.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/to-tools.ts#L83)

Build the [Tool](/api/@graphorin/core/interfaces/Tool.md) array for the supplied MCP tool catalogue.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `catalogue`: readonly [`MCPToolDefinition`](/api/@graphorin/mcp/interfaces/MCPToolDefinition.md)[]; `client`: [`MCPClient`](/api/@graphorin/mcp/interfaces/MCPClient.md); `logger?`: (`level`, `message`, `fields?`) => `void`; `options?`: [`MCPToToolsOptions`](/api/@graphorin/mcp/interfaces/MCPToToolsOptions.md); `serverIdentity`: [`ServerIdentity`](/api/@graphorin/mcp/type-aliases/ServerIdentity.md); \} |
| `args.catalogue` | readonly [`MCPToolDefinition`](/api/@graphorin/mcp/interfaces/MCPToolDefinition.md)[] |
| `args.client` | [`MCPClient`](/api/@graphorin/mcp/interfaces/MCPClient.md) |
| `args.logger?` | (`level`, `message`, `fields?`) => `void` |
| `args.options?` | [`MCPToToolsOptions`](/api/@graphorin/mcp/interfaces/MCPToToolsOptions.md) |
| `args.serverIdentity` | [`ServerIdentity`](/api/@graphorin/mcp/type-aliases/ServerIdentity.md) |

## Returns

`AdaptedToolsResult`

## Stable
