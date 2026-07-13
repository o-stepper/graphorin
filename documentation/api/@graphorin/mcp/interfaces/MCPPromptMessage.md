[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPPromptMessage

# Interface: MCPPromptMessage

Defined in: [packages/mcp/src/client/types.ts:401](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L401)

Single prompt message returned by `getPrompt(...)`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | [`MCPContentPart`](/api/@graphorin/mcp/type-aliases/MCPContentPart.md) | [packages/mcp/src/client/types.ts:403](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L403) |
| <a id="property-role"></a> `role` | `readonly` | `"user"` \| `"assistant"` | [packages/mcp/src/client/types.ts:402](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L402) |
