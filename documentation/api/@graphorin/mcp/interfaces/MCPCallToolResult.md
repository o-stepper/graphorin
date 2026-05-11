[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPCallToolResult

# Interface: MCPCallToolResult

Defined in: packages/mcp/src/client/types.ts:152

Tool result envelope returned by `callTool(...)`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | readonly [`MCPContentPart`](/api/@graphorin/mcp/type-aliases/MCPContentPart.md)[] | packages/mcp/src/client/types.ts:153 |
| <a id="property-iserror"></a> `isError?` | `readonly` | `boolean` | packages/mcp/src/client/types.ts:155 |
| <a id="property-structuredcontent"></a> `structuredContent?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/mcp/src/client/types.ts:154 |
