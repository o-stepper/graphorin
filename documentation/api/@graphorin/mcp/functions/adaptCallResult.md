[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / adaptCallResult

# Function: adaptCallResult()

```ts
function adaptCallResult(args): ToolReturn<unknown>;
```

Defined in: packages/mcp/src/client/adapt-result.ts:54

**`Internal`**

Convert an MCP `CallToolResult` into a typed Graphorin `ToolReturn`,
handling the structured-content + outputSchema round-trip and the
backward-compatible TextContent mirror.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `AdaptCallResultArgs` |

## Returns

[`ToolReturn`](/api/@graphorin/core/interfaces/ToolReturn.md)\&lt;`unknown`\&gt;
