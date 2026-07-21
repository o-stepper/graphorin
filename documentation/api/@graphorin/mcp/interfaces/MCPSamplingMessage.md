[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPSamplingMessage

# Interface: MCPSamplingMessage

Defined in: packages/mcp/src/client/types.ts:147

A message in a sampling conversation.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | readonly [`MCPSamplingContent`](/api/@graphorin/mcp/type-aliases/MCPSamplingContent.md)[] | Every content block of the SDK message - previously only the FIRST block survived, silently dropping e.g. the image in a text+image message before it reached the operator's handler. | packages/mcp/src/client/types.ts:154 |
| <a id="property-role"></a> `role` | `readonly` | `"user"` \| `"assistant"` | - | packages/mcp/src/client/types.ts:148 |
