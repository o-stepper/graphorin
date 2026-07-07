[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPCallToolResult

# Interface: MCPCallToolResult

Defined in: [packages/mcp/src/client/types.ts:306](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L306)

Tool result envelope returned by `callTool(...)`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | readonly [`MCPContentPart`](/api/@graphorin/mcp/type-aliases/MCPContentPart.md)[] | [packages/mcp/src/client/types.ts:307](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L307) |
| <a id="property-iserror"></a> `isError?` | `readonly` | `boolean` | [packages/mcp/src/client/types.ts:309](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L309) |
| <a id="property-structuredcontent"></a> `structuredContent?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/mcp/src/client/types.ts:308](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L308) |
