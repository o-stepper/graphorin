[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [](/api/@graphorin/mcp/README.md) / MCPSamplingMessage

# Interface: MCPSamplingMessage

Defined in: [packages/mcp/src/client/types.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L147)

A message in a sampling conversation.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | readonly [`MCPSamplingContent`](/api/@graphorin/mcp/type-aliases/MCPSamplingContent.md)[] | Every content block of the SDK message (MC-13) - previously only the FIRST block survived, silently dropping e.g. the image in a text+image message before it reached the operator's handler. | [packages/mcp/src/client/types.ts:154](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L154) |
| <a id="property-role"></a> `role` | `readonly` | `"user"` \| `"assistant"` | - | [packages/mcp/src/client/types.ts:148](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/client/types.ts#L148) |
