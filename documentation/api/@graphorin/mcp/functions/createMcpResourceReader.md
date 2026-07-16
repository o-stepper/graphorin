[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / createMcpResourceReader

# Function: createMcpResourceReader()

```ts
function createMcpResourceReader(opts): ResultReader;
```

Defined in: [packages/mcp/src/client/mcp-resource-reader.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/mcp-resource-reader.ts#L55)

Build a [ResultReader](/api/@graphorin/tools/interfaces/ResultReader.md) that resolves MCP resource URIs through
one or more connected [MCPClient](/api/@graphorin/mcp/interfaces/MCPClient.md)s.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`McpResourceReaderOptions`](/api/@graphorin/mcp/interfaces/McpResourceReaderOptions.md) |

## Returns

[`ResultReader`](/api/@graphorin/tools/interfaces/ResultReader.md)

## Stable
