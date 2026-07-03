[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPToolDefinition

# Interface: MCPToolDefinition

Defined in: packages/mcp/src/client/types.ts:239

Single MCP tool descriptor returned by `listTools()`. Mirrors the
MCP spec subset we consume.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | packages/mcp/src/client/types.ts:241 |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/mcp/src/client/types.ts:242 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/mcp/src/client/types.ts:240 |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/mcp/src/client/types.ts:243 |
| <a id="property-title"></a> `title?` | `readonly` | `string` | packages/mcp/src/client/types.ts:244 |
