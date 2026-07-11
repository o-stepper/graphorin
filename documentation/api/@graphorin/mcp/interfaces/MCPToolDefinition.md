[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPToolDefinition

# Interface: MCPToolDefinition

Defined in: [packages/mcp/src/client/types.ts:270](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L270)

Single MCP tool descriptor returned by `listTools()`. Mirrors the
MCP spec subset we consume.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | [packages/mcp/src/client/types.ts:272](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L272) |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/mcp/src/client/types.ts:273](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L273) |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/mcp/src/client/types.ts:271](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L271) |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/mcp/src/client/types.ts:274](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L274) |
| <a id="property-title"></a> `title?` | `readonly` | `string` | [packages/mcp/src/client/types.ts:275](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L275) |
