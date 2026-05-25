[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPToolDefinition

# Interface: MCPToolDefinition

Defined in: packages/mcp/src/client/types.ts:228

Single MCP tool descriptor returned by `listTools()`. Mirrors the
MCP spec subset we consume.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | packages/mcp/src/client/types.ts:230 |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/mcp/src/client/types.ts:231 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/mcp/src/client/types.ts:229 |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/mcp/src/client/types.ts:232 |
| <a id="property-title"></a> `title?` | `readonly` | `string` | packages/mcp/src/client/types.ts:233 |
