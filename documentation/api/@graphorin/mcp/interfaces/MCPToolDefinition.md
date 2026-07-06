[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPToolDefinition

# Interface: MCPToolDefinition

Defined in: packages/mcp/src/client/types.ts:270

Single MCP tool descriptor returned by `listTools()`. Mirrors the
MCP spec subset we consume.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | packages/mcp/src/client/types.ts:272 |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\<`string`, `unknown`\>\> | packages/mcp/src/client/types.ts:273 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/mcp/src/client/types.ts:271 |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | `Readonly`\<`Record`\<`string`, `unknown`\>\> | packages/mcp/src/client/types.ts:274 |
| <a id="property-title"></a> `title?` | `readonly` | `string` | packages/mcp/src/client/types.ts:275 |
